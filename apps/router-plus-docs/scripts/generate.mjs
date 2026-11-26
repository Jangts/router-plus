// Router Plus 文档站的内容生成：按 examples.mjs 的编排把抽取到的符号渲染为 API 页，
// 按语言分别写入 /en/ 与 /zh/（同级目录）；根路径只作为语言入口，不放首页内容。
import { writeFile, mkdir, rm, readdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { extractApi } from './extract-api.mjs';
import { renderPage } from './render-api.mjs';
import { pages, englishPages, pageExamples } from './examples.mjs';
import { locales } from './locales.mjs';
import { contentRoot, workspaceRoot } from './paths.mjs';
import { guidePages } from './guide.mjs';

const zhApi = path.join(contentRoot, 'zh', 'api');
const enApi = path.join(contentRoot, 'en', 'api');

const keyOf = (entry, name) => `${entry}|${name}`;

export async function generateSite() {
  const api = await extractApi();
  // 每个公开导出对（入口 + 名称）指向实际声明；同一份声明经多个入口重导出时共享记录。
  const byExport = new Map();
  for (const record of api.records)
    for (const item of record.imports) byExport.set(keyOf(item.entry, item.exported), record);

  const documented = new Set();
  function resolve(definitions) {
    return definitions.map((page) => ({
      ...page,
      symbols: page.symbols.map((name) => {
        const matches = new Set();
        for (const entry of page.modules) {
          const record = byExport.get(keyOf(entry, name));
          if (record) matches.add(record);
        }
        if (!matches.size) throw new Error(`编排清单引用了不存在的导出：${page.slug}:${name}`);
        if (matches.size > 1)
          throw new Error(`编排页面内同名导出指向多份声明：${page.slug}:${name}`);
        const record = [...matches][0];
        for (const item of record.imports)
          if (page.modules.includes(item.entry) && item.exported === name)
            documented.add(keyOf(item.entry, item.exported));
        return { name, record, summary: page.summaries[name] };
      }),
    }));
  }

  const resolvedZh = resolve(pages);
  const resolvedEn = resolve(englishPages);

  const allExports = new Set(
    api.modules.flatMap((module) => module.symbols.map((name) => keyOf(module.entry, name))),
  );
  const missing = [...allExports].filter((key) => !documented.has(key));
  const extra = [...documented].filter((key) => !allExports.has(key));
  if (missing.length || extra.length)
    throw new Error(
      `API 编排与公开导出不一致。未文档化：${missing.join(', ') || '无'}；不存在的导出：${extra.join(', ') || '无'}`,
    );

  const branding = path.join(contentRoot, 'public/branding');
  await mkdir(branding, { recursive: true });
  for (const file of ['router-plus-icon.png', 'router-plus-logo.png'])
    await copyFile(
      path.join(workspaceRoot, 'shared/visual-assets/branding/router-plus', file),
      path.join(branding, file),
    );
  await mkdir(zhApi, { recursive: true });
  await mkdir(enApi, { recursive: true });

  // 仅删除生成的 API 模块页，保留手写 index.md。
  async function cleanGenerated(dir) {
    for (const name of await readdir(dir).catch(() => [])) {
      if (name !== 'index.md' && name.endsWith('.md')) {
        await rm(path.join(dir, name));
      }
    }
  }
  await cleanGenerated(zhApi);
  await cleanGenerated(enApi);

  for (const page of resolvedZh) {
    await writeFile(
      path.join(zhApi, page.slug + '.md'),
      renderPage(page, pageExamples.zh[page.slug], locales[0]),
    );
  }
  for (const page of resolvedEn) {
    await writeFile(
      path.join(enApi, page.slug + '.md'),
      renderPage(page, pageExamples.en[page.slug], locales[1]),
    );
  }

  // 首页文案从语言清单生成，阅读路径直接消费指南清单，避免手写副本漂移。
  for (const locale of locales) {
    const home = locale.text.home;
    const scalar = (value) => JSON.stringify(value);
    const lines = [
      '---',
      'layout: home',
      'hero:',
      '  name: Router Plus',
      '  text: ' + scalar(home.heroText),
      '  tagline: ' + scalar(home.tagline),
      '  actions:',
      ...home.actions.flatMap((action) => [
        '    - theme: ' + action.theme,
        '      text: ' + scalar(action.text),
        '      link: ' + locale.prefix + action.path,
      ]),
      'features:',
      ...home.features.flatMap((feature) => [
        '  - title: ' + scalar(feature.title),
        '    details: ' + scalar(feature.details),
        '    link: ' + locale.prefix + feature.path,
      ]),
      '---',
      '',
      locale.id === 'zh' ? '## 阅读路径' : '## Reading paths',
      '',
      ...guidePages.map(
        (page) =>
          '- [' + (locale.id === 'zh' ? page.zh : page.en) + '](' + locale.prefix + page.link + ')',
      ),
      '- [API](' + locale.prefix + '/api/)',
      '',
    ];
    await writeFile(path.join(contentRoot, locale.dir, 'index.md'), lines.join('\n'));
  }

  // 根路径只是语言入口：不渲染首页内容，由 head 内联脚本按浏览器语言进入 /en/ 或 /zh/。
  await writeFile(path.join(contentRoot, 'index.md'), '---\nlayout: false\n---\n');

  const apiSidebar = (prefix, label, overview, list) => [
    {
      text: label,
      items: [
        { text: overview, link: prefix + 'api/' },
        ...list.map((page) => ({ text: page.title, link: prefix + 'api/' + page.slug })),
      ],
    },
  ];
  const sidebar = {
    '/en/api/': apiSidebar('/en/', locales[1].nav.api, 'Overview', resolvedEn),
    '/zh/api/': apiSidebar('/zh/', locales[0].nav.api, '总览', resolvedZh),
  };

  const report = {
    version: api.version,
    modules: api.modules.map((module) => module.module),
    publicExports: allExports.size,
    records: api.records.length,
    pages: resolvedZh.map((page) => ({
      slug: page.slug,
      route: '/zh/api/' + page.slug,
      symbols: page.symbols.map((symbol) => symbol.name),
    })),
  };
  return { sidebar, report };
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const { report } = await generateSite();
  console.log(JSON.stringify(report, null, 2));
}
