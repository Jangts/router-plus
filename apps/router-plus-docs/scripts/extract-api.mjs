// Router Plus 文档站的公开 API 抽取：按包的 package.json exports 逐个入口读取类型符号、
// 成员、签名与字段，供 generate.mjs 与手写编排清单对照。不执行 SDK 业务代码。
import ts from 'typescript';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { sdkRoot, posix } from './paths.mjs';

const format =
  ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
const privateMember = (node) =>
  (node.name && ts.isPrivateIdentifier(node.name)) ||
  node.modifiers?.some(
    (item) =>
      item.kind === ts.SyntaxKind.PrivateKeyword || item.kind === ts.SyntaxKind.ProtectedKeyword,
  );
const display = (parts) => ts.displayPartsToString(parts ?? []).trim();
const propertyName = (symbol, declaration) =>
  declaration?.name && ts.isComputedPropertyName(declaration.name)
    ? declaration.name.getText()
    : symbol.name;

/**
 * 抽取 Router Plus 全部公开入口的符号、成员、签名与字段。
 * 同一份声明经多个入口重导出时合并为一条记录，并保留全部导入路径。
 * @returns {Promise<{ version: string, records: object[], modules: object[] }>} 包版本、符号记录与公开模块清单。
 * @throws {Error} 公开入口找不到对应源码、模块符号或无法解析公开声明时抛出。
 */
export async function extractApi() {
  const pkg = JSON.parse(await readFile(path.join(sdkRoot, 'package.json'), 'utf8'));
  const config = ts.readConfigFile(path.join(sdkRoot, 'tsconfig.json'), ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, sdkRoot);
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const checker = program.getTypeChecker();
  const resolved = (symbol) =>
    symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const internal = (symbol) => symbol.getJsDocTags(checker).some((tag) => tag.name === 'internal');
  const isOwn = (node) => !!node && node.getSourceFile().fileName.startsWith(sdkRoot + path.sep);
  const docs = (symbol) =>
    symbol.declarations?.some((node) => node.jsDoc?.length)
      ? display(symbol.getDocumentationComment(checker))
      : '';
  const textOf = (type, node) => checker.typeToString(type, node, format);
  const properties = (type, node) => {
    if (
      type.flags &
      (ts.TypeFlags.Any |
        ts.TypeFlags.Unknown |
        ts.TypeFlags.TypeParameter |
        ts.TypeFlags.StringLike |
        ts.TypeFlags.NumberLike |
        ts.TypeFlags.BooleanLike |
        ts.TypeFlags.Never |
        ts.TypeFlags.Void)
    )
      return [];
    if (checker.isArrayType(type) || checker.isTupleType(type)) return [];
    return checker
      .getPropertiesOfType(type)
      .filter(
        (symbol) =>
          !internal(symbol) &&
          !symbol.declarations?.some(privateMember) &&
          symbol.declarations?.some(isOwn),
      )
      .map((symbol) => {
        const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0] ?? node;
        return {
          name: propertyName(symbol, declaration),
          type: textOf(checker.getTypeOfSymbolAtLocation(symbol, declaration), declaration),
          optional: !!(symbol.flags & ts.SymbolFlags.Optional),
          readonly:
            !!declaration?.modifiers?.some((x) => x.kind === ts.SyntaxKind.ReadonlyKeyword) ||
            (ts.isGetAccessorDeclaration(declaration) &&
              !symbol.declarations?.some(ts.isSetAccessorDeclaration)),
          description: docs(symbol),
        };
      });
  };
  const signatures = (type, node, construct = false) =>
    (construct ? type.getConstructSignatures() : type.getCallSignatures()).map((signature) => ({
      text: checker.signatureToString(
        signature,
        node,
        format,
        construct ? ts.SignatureKind.Construct : ts.SignatureKind.Call,
      ),
      construct,
      parameters: signature.parameters.map((parameter) => {
        const declaration = parameter.valueDeclaration ?? parameter.declarations?.[0] ?? node;
        // 解构参数会被编译器命名为 __1 等内部名称，改用绑定模式的原文作为展示名。
        const name =
          ts.isParameter(declaration) &&
          (ts.isObjectBindingPattern(declaration.name) ||
            ts.isArrayBindingPattern(declaration.name))
            ? declaration.name.getText()
            : parameter.name;
        return {
          name,
          type: textOf(checker.getTypeOfSymbolAtLocation(parameter, declaration), declaration),
          optional:
            !!(parameter.flags & ts.SymbolFlags.Optional) ||
            !!declaration.questionToken ||
            !!declaration.initializer,
          rest: !!declaration.dotDotDotToken,
          description: docs(parameter),
        };
      }),
      returns: textOf(checker.getReturnTypeOfSignature(signature), node),
      description: signature.declaration?.jsDoc?.length
        ? display(signature.getDocumentationComment(checker))
        : '',
    }));

  const records = new Map();
  const modules = [];
  for (const [entry, target] of Object.entries(pkg.exports)) {
    // 样式等非 TypeScript 入口没有声明文件，跳过。
    if (typeof target !== 'object' || !target.types) continue;
    const sourceName = path.join(
      sdkRoot,
      target.types.replace('./dist/esm/', 'src/').replace(/\.d\.ts$/, '.ts'),
    );
    const source = program.getSourceFile(sourceName);
    if (!source) throw new Error(`公开入口没有对应源码：${entry}: ${sourceName}`);
    const module = checker.getSymbolAtLocation(source);
    if (!module) throw new Error(`公开入口没有模块符号：${entry}`);
    const item = { entry, module: pkg.name + (entry === '.' ? '' : entry.slice(1)), symbols: [] };
    for (const exported of checker.getExportsOfModule(module)) {
      const symbol = resolved(exported);
      if (internal(symbol)) continue;
      const node = symbol.valueDeclaration ?? symbol.declarations?.[0];
      if (!node) throw new Error(`无法解析公开声明：${entry}:${exported.name}`);
      // 以声明位置为身份：React 与 Vue 的同名组件是两份实现，必须分别记录；
      // 状态库入口重导出的同一份 common 声明则合并为一条。
      const key = node.getSourceFile().fileName + '#' + exported.name;
      let record = records.get(key);
      if (!record) {
        const type = checker.getTypeOfSymbolAtLocation(symbol, node);
        const instance =
          symbol.flags &
          (ts.SymbolFlags.Class | ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias)
            ? checker.getDeclaredTypeOfSymbol(symbol)
            : type;
        const callableType = symbol.flags & ts.SymbolFlags.Value ? type : instance;
        const runtime = !!(symbol.flags & ts.SymbolFlags.Value);
        const kind =
          symbol.flags & ts.SymbolFlags.Class
            ? 'class'
            : symbol.flags & ts.SymbolFlags.Interface
              ? 'interface'
              : symbol.flags & ts.SymbolFlags.TypeAlias
                ? 'type'
                : type.getCallSignatures().length
                  ? 'function'
                  : 'constant';
        const members = [];
        const collect = (value, isStatic) => {
          for (const member of checker.getPropertiesOfType(value)) {
            const declaration = member.valueDeclaration ?? member.declarations?.[0];
            if (
              !declaration ||
              privateMember(declaration) ||
              internal(member) ||
              member.name === 'prototype' ||
              !isOwn(declaration)
            )
              continue;
            // 以 `[Symbol.hasInstance]` 形式声明的品牌方法属于运行时内部机制，不作为公开成员。
            if (
              ts.isComputedPropertyName(declaration.name) &&
              /Symbol\./.test(declaration.name.getText())
            )
              continue;
            const name = propertyName(member, declaration);
            const memberType = checker.getTypeOfSymbolAtLocation(member, declaration);
            const calls = [
              ...signatures(memberType, declaration, true),
              ...signatures(memberType, declaration),
            ];
            if (calls.length)
              members.push({
                name,
                static: isStatic,
                description: docs(member),
                signatures: calls,
              });
          }
        };
        if (runtime) {
          if (symbol.flags & ts.SymbolFlags.Class) {
            collect(type, true);
            collect(instance, false);
          } else collect(type, false);
        }
        const instanceFields =
          symbol.flags & ts.SymbolFlags.Class ? properties(instance, node) : [];
        const methodNames = new Set(
          members.filter((member) => !member.static).map((member) => member.name),
        );
        record = {
          name: exported.name,
          kind,
          runtime,
          description: docs(symbol),
          origin: posix(path.relative(sdkRoot, node.getSourceFile().fileName)),
          typeParameters: (node.typeParameters ?? []).map((parameter) => ({
            name: parameter.name.text,
            constraint: parameter.constraint?.getText() ?? '',
            default: parameter.default?.getText() ?? '',
          })),
          bases:
            node.heritageClauses?.flatMap((clause) => clause.types.map((type) => type.getText())) ??
            [],
          typeExpression: ts.isTypeAliasDeclaration(node) ? node.type.getText() : '',
          valueType: textOf(type, node),
          signatures: [...signatures(callableType, node, true), ...signatures(callableType, node)],
          fields: runtime
            ? instanceFields.filter((field) => !methodNames.has(field.name))
            : properties(instance, node),
          members,
          aliases: [],
          imports: [],
        };
        records.set(key, record);
      }
      if (!record.aliases.includes(exported.name)) record.aliases.push(exported.name);
      record.imports.push({ module: item.module, exported: exported.name, entry });
      item.symbols.push(exported.name);
    }
    modules.push(item);
  }
  return {
    version: pkg.version,
    records: [...records.values()].sort((a, b) => a.name.localeCompare(b.name)),
    modules,
  };
}
