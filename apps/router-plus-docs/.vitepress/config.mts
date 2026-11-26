/**
 * VitePress 站点配置：读取部署域名与子路径环境变量，合并 generateSite 产出的
 * API 侧边栏，并声明中英文双语导航、搜索与页脚。
 * 各语言位于同级目录（/en/、/zh/）；根路径按浏览器语言进入对应首页。
 */
import { defineConfig } from 'vitepress';
import { generateSite } from '../scripts/generate.mjs';
import { guidePages } from '../scripts/guide.mjs';
import { locales as siteLocales } from '../scripts/locales.mjs';
import { alternateRoutes, routeFromRelative } from '../scripts/locale-routes.mjs';

const base = process.env.ROUTER_PLUS_DOCS_BASE ?? '/';
const origin = process.env.ROUTER_PLUS_DOCS_ORIGIN ?? 'https://router-plus-docs.pages.jangts.cafe';
if (new URL(origin).origin !== origin || !/^https?:/.test(origin))
  throw new Error('ROUTER_PLUS_DOCS_ORIGIN must be an http(s) origin without a path.');
if (!/^\/(?:[a-zA-Z0-9._~-]+\/)*$/.test(base) || base.includes('/../'))
  throw new Error(
    'ROUTER_PLUS_DOCS_BASE must be / or a trailing-slash URL path such as /router-plus/.',
  );

function themeFor(locale, generated) {
  const t = locale.theme;
  const p = (value) => locale.prefix + value;
  return {
    nav: [
      { text: locale.nav.guide, link: p('/guide/') },
      { text: locale.nav.api, link: p('/api/') },
      { text: `v${generated.report.version}`, link: p('/guide/') },
    ],
    sidebar: {
      [p('/guide/')]: [
        {
          text: locale.id === 'zh' ? '使用指南' : 'Guide',
          items: guidePages.map((page) => ({
            text: locale.id === 'zh' ? page.zh : page.en,
            link: p(page.link),
          })),
        },
      ],
      [p('/api/')]: generated.sidebar[p('/api/')] ?? generated.sidebar['/api/'],
    },
    outline: { level: [2, 3], label: t.outlineLabel },
    returnToTopLabel: t.returnToTopLabel,
    sidebarMenuLabel: t.sidebarMenuLabel,
    darkModeSwitchLabel: t.darkModeSwitchLabel,
    lightModeSwitchTitle: t.lightModeSwitchTitle,
    darkModeSwitchTitle: t.darkModeSwitchTitle,
    docFooter: { prev: t.docFooterPrev, next: t.docFooterNext },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: t.searchButtonText, buttonAriaLabel: t.searchButtonAriaLabel },
          modal: {
            noResultsText: t.searchNoResultsText,
            resetButtonTitle: t.searchResetButtonTitle,
            displayDetails: t.searchDisplayDetails,
            footer: {
              selectText: t.searchSelectText,
              navigateText: t.searchNavigateText,
              closeText: t.searchCloseText,
            },
          },
        },
        miniSearch: {
          options: {
            tokenize: (text: string) =>
              Array.from(
                new Intl.Segmenter(locale.lang, { granularity: 'word' }).segment(text),
                (part) => part.segment.toLowerCase(),
              ).filter((term) => /[\p{L}\p{N}_]/u.test(term)),
          },
          searchOptions: { prefix: true, fuzzy: 0.15 },
        },
      },
    },
    footer: { message: t.footerMessage, copyright: t.footerCopyright },
  };
}

export default async () => {
  const generated = await generateSite();
  const englishLocale = siteLocales.find((locale) => locale.id === 'en');

  const alternateHead = (pageData) => {
    const routes = alternateRoutes(pageData.relativePath);
    // 根路径为语言入口；各语言页面保留独立规范地址。
    const canonical =
      pageData.relativePath === 'index.md' ? routes.en : routeFromRelative(pageData.relativePath);
    return [
      ['link', { rel: 'canonical', href: origin + base + canonical.slice(1) }],
      ['link', { rel: 'alternate', hreflang: 'zh-CN', href: origin + base + routes.zh.slice(1) }],
      ['link', { rel: 'alternate', hreflang: 'en', href: origin + base + routes.en.slice(1) }],
      [
        'link',
        { rel: 'alternate', hreflang: 'x-default', href: origin + base + routes.en.slice(1) },
      ],
    ];
  };

  return defineConfig({
    title: englishLocale.title,
    description: englishLocale.description,
    lang: englishLocale.lang,
    base,
    head: [
      ['link', { rel: 'icon', type: 'image/png', href: base + 'branding/router-plus-icon.png' }],
      ['script', { src: base + 'auto-lang.js' }],
    ],
    srcDir: 'content',
    outDir: 'dist',
    cleanUrls: false,
    lastUpdated: false,
    sitemap: { hostname: origin + base },
    transformHead: ({ pageData }) => alternateHead(pageData),
    markdown: {
      lineNumbers: true,
      theme: { light: 'github-light', dark: 'github-dark' },
    },
    locales: Object.fromEntries(
      siteLocales.map((locale) => [
        locale.viteKey,
        {
          label: locale.label,
          lang: locale.lang,
          link: locale.prefix + '/',
          title: locale.title,
          description: locale.description,
          themeConfig: themeFor(locale, generated),
        },
      ]),
    ),
    themeConfig: {
      logo: { src: '/branding/router-plus-icon.png', alt: 'Router Plus' },
      siteTitle: 'Router Plus',
      // 语言入口使用顶层缺省；正文分别使用 /en/、/zh/ 配置。
      ...themeFor(englishLocale, generated),
    },
  });
};
