/**
 * API 参考页的 Markdown 渲染器：把从包声明提取的记录组织成目录、定义、
 * 字段表、成员签名与使用示例。只负责排版与转义，不解析源码或判断类型语义。
 */
import { slug } from './paths.mjs';

export const fence = (code, language = 'ts') => `\n\`\`\`${language}\n${code.trim()}\n\`\`\`\n`;
const inline = (value) =>
  '`' + String(value).replaceAll('`', '\\`').replaceAll('|', '\\|').replace(/\r?\n/g, ' ') + '`';
const cell = (value) =>
  String(value ?? '')
    .replaceAll('|', '\\|')
    .replace(/\r?\n/g, ' ')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
const frontmatter = (title) => `---\ntitle: ${JSON.stringify(title)}\noutline: [2, 3]\n---\n\n`;
const note = (notes, record, key) => notes?.[`${record.name}.${key}`];

function fieldTable(fields, notes, record, locale) {
  const t = locale.text.render;
  if (!fields?.length) return '';
  return (
    '\n| ' +
    [t.tableField, t.tableType, t.tableRequired, t.tableDescription].join(' | ') +
    ' |\n' +
    '| --- | --- | --- | --- |\n' +
    fields
      .map((field) => {
        const description = note(notes, record, field.name) ?? field.description;
        return `| ${inline(field.name)} | ${inline(field.type)} | ${field.optional ? t.optional : t.required} | ${cell(description) || t.seeDefinition} |`;
      })
      .join('\n') +
    '\n'
  );
}

function genericTable(parameters, locale) {
  const t = locale.text.render;
  if (!parameters?.length) return '';
  return (
    '\n| ' +
    [t.tableParameter, t.tableConstraint, t.tableDefault].join(' | ') +
    ' |\n' +
    '| --- | --- | --- |\n' +
    parameters
      .map(
        (parameter) =>
          `| ${inline(parameter.name)} | ${parameter.constraint ? inline(parameter.constraint) : '—'} | ${parameter.default ? inline(parameter.default) : '—'} |`,
      )
      .join('\n') +
    '\n'
  );
}

function callSection(signature, name, locale) {
  const t = locale.text.render;
  // 组件函数的返回类型可能展开整个 React 元素结构；超过合理长度时改用参数重建签名。
  const abbreviated = signature.text.length > 1500;
  const signatureText = abbreviated
    ? `${name}(${signature.parameters
        .map(
          (parameter) =>
            `${parameter.rest ? '...' : ''}${parameter.name}${parameter.optional ? '?' : ''}: ${parameter.type.length > 180 ? parameter.type.slice(0, 180) + '…' : parameter.type}`,
        )
        .join(', ')})`
    : signature.construct
      ? signature.text.replace(/^new\s*/, `new ${name}`)
      : `${name}${signature.text}`;
  let result = `\n${fence(signatureText)}\n`;
  if (signature.description) result += signature.description + '\n';
  if (signature.parameters.length)
    result +=
      '\n| ' +
      [t.tableField, t.tableType, t.tablePassing, t.tableDescription].join(' | ') +
      ' |\n' +
      '| --- | --- | --- | --- |\n' +
      signature.parameters
        .map(
          (parameter) =>
            `| ${inline(parameter.name)} | ${inline(parameter.type.length > 300 ? parameter.type.slice(0, 300) + '…' : parameter.type)} | ${parameter.rest ? t.rest : parameter.optional ? t.optional : t.required} | ${cell(parameter.description) || '—'} |`,
        )
        .join('\n') +
      '\n';
  else result += '\n' + t.noParameters + '\n';
  const returns =
    signature.returns.length > 300 ||
    /DetailedReactHTMLElement|JSX\.Element/.test(signature.returns)
      ? 'React.ReactElement | null'
      : signature.returns;
  result += `\n${t.returns} ${inline(returns)}\n`;
  return result;
}

function definitionSummary(record, locale) {
  const t = locale.text.render;
  const head =
    record.name +
    (record.typeParameters?.length
      ? `<${record.typeParameters.map((parameter) => parameter.name).join(', ')}>`
      : '');
  if (record.kind === 'class' || record.kind === 'interface') {
    let result = fence(
      `${record.kind} ${head}${record.bases?.length ? ` extends ${record.bases.join(', ')}` : ''}`,
    );
    if (record.typeParameters?.length)
      result += `\n#### ${t.typeParameters}\n` + genericTable(record.typeParameters, locale);
    return result;
  }
  if (record.kind === 'type') {
    if (record.fields.length)
      return `\n**${t.typeAlias}:** ${inline(head)}${record.typeParameters?.length ? '\n\n#### ' + t.typeParameters + '\n' + genericTable(record.typeParameters, locale) : ''}\n`;
    return (
      fence(`type ${head} = ${record.typeExpression};`) +
      (record.typeParameters?.length
        ? `\n#### ${t.typeParameters}\n` + genericTable(record.typeParameters, locale)
        : '')
    );
  }
  if (record.kind === 'constant' && !record.members.length)
    return fence(`const ${head}: ${record.valueType}`);
  if (record.kind === 'constant') return `\n**${t.namespace}:** ${inline(head)}\n`;
  return '';
}

function memberSection(record, notes, locale) {
  const t = locale.text.render;
  const table =
    '\n' +
    t.members +
    '\n\n| ' +
    [t.tableMember, t.tablePurpose].join(' | ') +
    ' |\n' +
    '| --- | --- |\n' +
    record.members
      .map(
        (member) =>
          `| [${inline(member.name)}](#member-${slug(record.name)}-${slug(member.name)}) | ${cell(note(notes, record, member.name) ?? member.description) || t.seeSignature} |`,
      )
      .join('\n') +
    '\n';
  const details = record.members
    .map((member) => {
      const callName =
        record.kind === 'class' && !member.static ? member.name : `${record.name}.${member.name}`;
      let section =
        `\n#### ${member.name} {#member-${slug(record.name)}-${slug(member.name)}}\n\n` +
        (record.kind === 'class'
          ? `${member.static ? t.staticMember : t.instanceMethod}\n\n`
          : '') +
        (() => {
          const description = note(notes, record, member.name) ?? member.description;
          return description ? `${description}\n` : '';
        })();
      for (const signature of member.signatures)
        section += callSection(signature, callName, locale);
      return section;
    })
    .join('\n');
  return table + details;
}

export function renderSymbol(record, notes, locale, modules, summary) {
  const t = locale.text.render;
  const heading = `## ${record.name} {#api-${slug(record.name)}}`;
  const description = summary ?? record.description;
  const imports = [
    ...new Set(
      record.imports
        .filter((item) => !modules || modules.includes(item.entry))
        .map((item) => item.module),
    ),
  ];
  let result =
    `\n${heading}\n\n` +
    (description ? `${description}\n\n` : '') +
    (imports.length ? `${t.import} ${imports.map(inline).join(t.joiner)}。\n` : '') +
    `\n${t.definition}\n${definitionSummary(record, locale)}`;
  if (record.signatures.length) {
    record.signatures.forEach((signature, index) => {
      const title = signature.construct
        ? t.constructor
        : record.signatures.length === 1
          ? t.call
          : t.overload(index);
      result += `\n#### ${title}\n` + callSection(signature, record.name, locale);
    });
  }
  if (record.fields.length)
    result += `\n${t.fields}\n` + fieldTable(record.fields, notes, record, locale);
  if (record.members.length) result += memberSection(record, notes, locale);
  return result;
}

/**
 * 收敛空行：相邻的空行只保留一个，围栏代码块内部原样保留。
 *
 * 各段渲染结果拼接时会带上多余的换行；统一在这里处理，避免生成文件出现连续空行。
 *
 * @param markdown 已拼接的页面正文。
 * @returns 只有一个空行分隔的正常 Markdown。
 */
function normalizeBlankLines(markdown) {
  const lines = markdown.split('\n');
  const result = [];
  let fence = false;
  let blank = false;
  for (const line of lines) {
    // 只把行首的三反引号／波浪号当作围栏边界，行内代码不影响状态。
    if (/^(```|~~~)/.test(line)) {
      fence = !fence;
      blank = false;
      result.push(line);
      continue;
    }
    if (!fence && line.trim() === '') {
      if (blank) continue;
      blank = true;
      result.push('');
      continue;
    }
    blank = false;
    result.push(line);
  }
  return result.join('\n');
}

export function renderPage(page, examples = '', locale) {
  const t = locale.text.render;
  const overview =
    `\n## ${t.contents}\n\n| ${[t.tableSymbol, t.tableKind, t.tableDescription].join(' | ')} |\n` +
    '| --- | --- | --- |\n' +
    page.symbols
      .map(
        (symbol) =>
          `| [${inline(symbol.name)}](#api-${slug(symbol.name)}) | ${t.kindLabel(symbol.record.kind)} | ${cell(symbol.summary ?? symbol.record.description)} |`,
      )
      .join('\n') +
    '\n';
  const body = page.symbols
    .map((symbol) => renderSymbol(symbol.record, page.notes, locale, page.modules, symbol.summary))
    .join('\n');
  const exampleSection = examples?.trim() ? `\n## ${t.examples}\n\n${examples.trim()}\n` : '';
  return normalizeBlankLines(
    frontmatter(page.title) +
      `# ${page.title}\n\n${page.lead}\n${overview}\n${body}${exampleSection}`,
  );
}
