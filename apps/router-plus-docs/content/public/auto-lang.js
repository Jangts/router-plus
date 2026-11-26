(() => {
  const key = 'router-plus-doc-lang';
  const explicit = (() => {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  })();
  const currentPath = location.pathname;
  const baseEl = document.querySelector('base');
  const base = baseEl ? baseEl.getAttribute('href') : '/';
  const basePrefix = new URL(base, location.origin).pathname;
  if (!currentPath.startsWith(basePrefix)) return;
  const afterBase = currentPath.slice(basePrefix.length).replace(/^\/+/, '');
  const hasLocale = /^(?:en|zh)(?:\/|$)/.test(afterBase);
  const currentLocale = afterBase.startsWith('zh') ? 'zh' : 'en';
  const targetLocale = explicit || (() => {
    const lang = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    return /^zh\b/i.test(lang) ? 'zh' : 'en';
  })();
  // 已在目标语言目录内：保留当前内页地址，不做任何跳转。
  if (hasLocale && targetLocale === currentLocale) return;
  // 根路径没有语言目录，按浏览器语言进入对应语言的首页。
  const rest = hasLocale ? afterBase.replace(/^(?:en|zh)\/?/, '') : afterBase;
  const targetPath = basePrefix + targetLocale + '/' + rest;
  if (targetPath !== currentPath) location.replace(targetPath + location.search + location.hash);
})();
