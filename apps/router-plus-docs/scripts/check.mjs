// Router Plus 文档站的产物检查：先完整执行一次生成，再核对公开导出与手写编排清单一致、
// 双语页面都实际写出、路由不碰撞、无内部符号或本地路径混入。
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { generateSite } from './generate.mjs';
import { extractApi } from './extract-api.mjs';
import { pages } from './examples.mjs';
import { guidePages } from './guide.mjs';
import { contentRoot } from './paths.mjs';

const exists = (filename) =>
  access(filename).then(
    () => true,
    () => false,
  );

const { report } = await generateSite();
const api = await extractApi();
const publicExports = api.modules.flatMap((module) =>
  module.symbols.map((name) => `${module.entry}|${name}`),
);
assert.ok(publicExports.length > 0, '公开 API 为空');
assert.equal(report.publicExports, publicExports.length, '生成的导出数量与抽取不一致');

const routes = [
  ...pages.map((page) => '/en/api/' + page.slug),
  ...pages.map((page) => '/zh/api/' + page.slug),
];
assert.equal(new Set(routes).size, routes.length, 'API 路由碰撞');
assert.equal(new Set(pages.map((page) => page.slug)).size, pages.length, '页面 slug 碰撞');

for (const record of api.records) {
  assert.ok(/^[A-Za-z_$][\w$]*$/.test(record.name), `非法公开名称：${record.name}`);
  assert.ok(
    !record.name.includes('/Users/') && !record.name.includes('__@'),
    `内部符号混入公开名称：${record.name}`,
  );
  const parameters = [
    ...(record.signatures ?? []),
    ...record.members.flatMap((member) => member.signatures),
  ].flatMap((signature) => signature.parameters);
  for (const parameter of parameters)
    assert.ok(
      !/^__\d+$/.test(parameter.name),
      `编译器内部参数名混入：${record.name}.${parameter.name}`,
    );
  for (const member of record.members) {
    assert.ok(
      /^[\w$]+$/.test(member.name) && !member.name.includes('__@'),
      `内部成员混入：${record.name}.${member.name}`,
    );
  }
}

for (const locale of ['zh', 'en']) {
  const apiDir = path.join(contentRoot, locale, 'api');
  assert.ok(await exists(apiDir), `缺少 ${locale} API 目录`);
  const files = (await readdir(apiDir)).filter((name) => name.endsWith('.md'));
  assert.ok(files.includes('index.md'), `手写总览 /${locale}/api/index.md 缺失`);
  const generated = files
    .filter((name) => name !== 'index.md')
    .map((name) => name.replace(/\.md$/, ''));
  assert.deepEqual(
    [...generated].sort(),
    pages.map((page) => page.slug).sort(),
    `${locale} 生成页面与编排清单不一致`,
  );
  for (const slug of generated) {
    const text = await readFile(path.join(apiDir, slug + '.md'), 'utf8');
    assert.ok(text.trim().length > 0, `${locale} 生成页面为空：${slug}`);
    assert.ok(
      !/dist\/esm/.test(text) && !/\/Users\//.test(text),
      `${locale} 生成页面混入本地路径或构建内部符号：${slug}`,
    );
  }
}

// 指南页面中英文都实际存在，且位于同级语言目录。
for (const locale of ['zh', 'en']) {
  const guideDir = path.join(contentRoot, locale, 'guide');
  for (const page of guidePages) {
    const name = page.slug + '.md';
    assert.ok(await exists(path.join(guideDir, name)), `Missing ${locale} guide page: ${name}`);
  }
}

// 根路径只是语言入口：不渲染首页内容，由 head 内联脚本按浏览器语言进入 /en/ 或 /zh/。
const rootEntry = await readFile(path.join(contentRoot, 'index.md'), 'utf8');
assert.ok(rootEntry.includes('layout: false'), '根路径必须是语言入口，而不是某个语言的首页');
assert.ok(!/^#|layout: home/m.test(rootEntry), '根路径不应渲染首页内容');

console.log(
  JSON.stringify(
    {
      modules: api.modules.length,
      publicExports: publicExports.length,
      records: api.records.length,
      pages: pages.length,
      locales: ['zh', 'en'],
      routes,
    },
    null,
    2,
  ),
);

// 核对每个教程与 API 示例实际导入的 SDK 名称，防止已移除入口残留在手写内容中。
const exportsByModule = new Map(
  api.modules.map((module) => [module.module, new Set(module.symbols)]),
);
async function checkExampleImports(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await checkExampleImports(filename);
    } else if (entry.name.endsWith('.md')) {
      const text = await readFile(filename, 'utf8');
      for (const block of text.matchAll(/```(?:tsx?|jsx?)\n([\s\S]*?)```/g)) {
        const source = ts.createSourceFile(
          filename + '.tsx',
          block[1],
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TSX,
        );
        for (const node of source.statements) {
          if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue;
          const module = node.moduleSpecifier.text;
          if (!module.startsWith('@jangts/router-plus')) continue;
          const exported = exportsByModule.get(module);
          assert.ok(exported, `Unknown SDK entry in ${filename}: ${module}`);
          const bindings = node.importClause?.namedBindings;
          if (bindings && ts.isNamedImports(bindings))
            for (const item of bindings.elements) {
              const name = (item.propertyName ?? item.name).text;
              assert.ok(
                exported.has(name),
                `Non-public SDK import in ${filename}: ${module}/${name}`,
              );
            }
        }
      }
    }
  }
}
await checkExampleImports(contentRoot);
