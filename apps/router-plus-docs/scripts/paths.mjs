/**
 * 文档生成脚本的路径常量与命名工具：集中解析站点、workspace 与 SDK 源码位置，
 * 并统一 slug／POSIX 路径转换，避免各脚本各自拼接相对路径。
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** 站点根目录，即 apps/router-plus-docs。 */
export const siteRoot = fileURLToPath(new URL('../', import.meta.url));
/** 仓库根目录，用于定位公共包与 SDK 源码。 */
export const workspaceRoot = path.resolve(siteRoot, '../..');
/** Router Plus 包根目录，API 页面从这里提取声明。 */
export const sdkRoot = path.join(workspaceRoot, 'packages/router-plus');
/** 生成的 Markdown 内容根目录。 */
export const contentRoot = path.join(siteRoot, 'content');
/**
 * 把平台路径分隔符统一为 POSIX 斜杠，供 Markdown 链接与清单使用。
 * @param value 任意平台的路径字符串。
 * @returns 使用 `/` 分隔的路径。
 */
export const posix = (value) => value.split(path.sep).join('/');
/**
 * 把符号名转成稳定的锚点片段。
 * @param value 原始名称，可含点号、尖括号等字符。
 * @returns 仅保留字母数字、下划线与连字符的小写字符串。
 */
export const slug = (value) =>
  value
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    // 去掉首尾分隔符，避免生成以连字符开头或结尾的锚点。
    .replace(/^-|-$/g, '')
    .toLowerCase();
