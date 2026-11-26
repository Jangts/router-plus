<script setup lang="ts">
/**
 * Router Plus 文档站语言切换入口：根据当前页面路由给出另一语言的等价地址，
 * 并在点击时把用户显式选择写入 localStorage。
 */
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';
import { alternateRoutes, localeOfPath } from '../../scripts/locale-routes.mjs';
import { locales, storageKey } from '../../scripts/locales.mjs';

const { page } = useData();

const target = computed(() => {
  const current = localeOfPath(page.value.relativePath);
  const other = current === 'zh' ? 'en' : 'zh';
  const currentLocale = locales.find((locale) => locale.id === current);
  const otherLocale = locales.find((locale) => locale.id === other);
  const routes = alternateRoutes(page.value.relativePath);
  return {
    label: currentLocale?.switchLabel ?? otherLocale?.label ?? other,
    lang: otherLocale?.lang ?? other,
    href: withBase(routes[other]),
    other,
  };
});

function onClick() {
  try {
    localStorage.setItem(storageKey, target.value.other);
  } catch {
    // ignore
  }
}
</script>

<template>
  <a class="router-plus-locale-switch" :href="target.href" :hreflang="target.lang" @click="onClick">
    {{ target.label }}
  </a>
</template>
