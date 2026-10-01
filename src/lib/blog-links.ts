export const OPEN_BLOG_EVENT = 'anacan:open-blog';
const PENDING_KEY = 'anacan-pending-blog-v1';
export function validBlogSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 300 && value !== '.' && value !== '..'
    && !/[\s/\\\u0000-\u001f<>]/u.test(value);
}
export function blogLinks(slug: string) {
  if (!validBlogSlug(slug)) throw new Error('BLOG_SLUG_INVALID');
  const path = `/blog/${encodeURIComponent(slug)}`;
  return { website: `https://anacan.az${path}`, app: `https://api.anacan.az${path}` };
}
export function appBlogSlug(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.port) return null;
    let path: string;
    if (url.protocol === 'anacan:' && url.hostname === 'blog') path = `/blog${url.pathname}`;
    else if (url.protocol === 'https:' && ['api.anacan.az','app.anacan.az'].includes(url.hostname)) path = url.pathname;
    else return null;
    const match = /^\/blog\/([^/]+)\/?$/.exec(path);
    if (!match) return null;
    const slug = decodeURIComponent(match[1]);
    return validBlogSlug(slug) ? slug : null;
  } catch { return null; }
}
export function isWebsiteBlogLink(value: string): boolean {
  try { const u = new URL(value); return u.protocol === 'https:' && u.hostname === 'anacan.az' && !u.username && !u.password && !u.port
    && /^\/blog\/[^/]+\/?$/.test(u.pathname) && validBlogSlug(decodeURIComponent(u.pathname.split('/')[2])); } catch { return false; }
}
export function rememberBlog(slug: string) {
  if (!validBlogSlug(slug)) return;
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify({ slug, at: Date.now() })); } catch { /* navigation still works in memory */ }
}
export function pendingBlog(): string | null {
  try { const value = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null'); const age = Date.now() - value?.at; return validBlogSlug(value?.slug) && typeof value.at === 'number' && age >= 0 && age < 86400000 ? value.slug : null; } catch { return null; }
}
export function clearPendingBlog() { try { sessionStorage.removeItem(PENDING_KEY); } catch { /* optional persistence */ } }
export function openAppBlog(value: string): boolean {
  const slug = appBlogSlug(value);
  if (!slug) return false;
  rememberBlog(slug); window.dispatchEvent(new CustomEvent(OPEN_BLOG_EVENT, { detail: { slug } })); return true;
}
export async function copyBlogLink(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(value); return; }
  const previous = document.activeElement as HTMLElement | null;
  const input = document.createElement('textarea'); input.value = value; input.readOnly = true;
  input.style.cssText = 'position:fixed;opacity:0;inset:0;pointer-events:none;'; document.body.append(input); input.select();
  try { if (!document.execCommand('copy')) throw new Error('CLIPBOARD_UNAVAILABLE'); }
  finally { input.remove(); previous?.focus({ preventScroll: true }); }
}
