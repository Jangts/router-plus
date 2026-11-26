// 指南课程页面清单：导航侧边栏与产物检查共用同一份声明，新增课程页只需在此登记。
export const guidePages = [
  { slug: 'index', zh: '使用指南', en: 'Guide overview', link: '/guide/' },
  {
    slug: 'getting-started',
    zh: '接入与生命周期',
    en: 'Integration and lifecycle',
    link: '/guide/getting-started',
  },
  {
    slug: 'pages-and-instances',
    zh: '页面与实例',
    en: 'Pages and instances',
    link: '/guide/pages-and-instances',
  },
  {
    slug: 'navigation',
    zh: '导航与结果',
    en: 'Navigation and results',
    link: '/guide/navigation',
  },
  {
    slug: 'state-and-tabs',
    zh: '原生状态与查询参数',
    en: 'Native state and queries',
    link: '/guide/state-and-tabs',
  },
  { slug: 'application-integration', zh: '应用完整接入', en: 'Application recipes', link: '/guide/application-integration' },
  {
    slug: 'state-access',
    zh: '状态访问与命令编组',
    en: 'State access and sequences',
    link: '/guide/state-access',
  },
  {
    slug: 'stores',
    zh: '状态库接入',
    en: 'Store integration',
    link: '/guide/stores',
  },
  {
    slug: 'guards-and-plugins',
    zh: '守卫与插件',
    en: 'Guards and plugins',
    link: '/guide/guards-and-plugins',
  },
  {
    slug: 'interactions',
    zh: '高亮与导览',
    en: 'Highlights and tours',
    link: '/guide/interactions',
  },
  {
    slug: 'state-ssr-and-testing',
    zh: 'SSR 与测试',
    en: 'SSR and testing',
    link: '/guide/state-ssr-and-testing',
  },
  {slug: 'testing', zh: '消费端测试', en: 'Consumer testing', link: '/guide/testing'},
];
