/**
 * Router Plus 文档站主题入口：沿用 VitePress 默认主题，在导航栏追加语言切换，并加载本站样式覆盖。
 * 由 .vitepress/theme/index.ts 转出，供框架加载。
 */
import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import LanguageSwitch from './LanguageSwitch.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'nav-bar-content-after': () => h(LanguageSwitch),
    }),
};
