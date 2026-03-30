import { Capacitor } from '@capacitor/core';

// ═══════════════════════════════════════════════════════════════════════════
// DEEPLINK SYSTEM — anacan:// + https://app.anacan.az Universal Links
// ═══════════════════════════════════════════════════════════════════════════

export interface DeeplinkRoute {
  key: string;
  label: string;
  label_az: string;
  pattern: string; // e.g. /tool/{id}
  example: string;
  category: string;
  description_az: string;
}

// All supported deeplink routes
export const DEEPLINK_ROUTES: DeeplinkRoute[] = [
  // ─── Tabs ───
  { key: 'home', label: 'Home', label_az: 'Ana səhifə', pattern: '/', example: '/', category: 'Əsas', description_az: 'Ana səhifəni açır' },
  { key: 'tools', label: 'Tools', label_az: 'Alətlər', pattern: '/tools', example: '/tools', category: 'Əsas', description_az: 'Alətlər hubunu açır' },
  { key: 'ai', label: 'AI Chat', label_az: 'AI Söhbət', pattern: '/ai', example: '/ai', category: 'Əsas', description_az: 'AI söhbəti açır' },
  { key: 'community', label: 'Community', label_az: 'İcma', pattern: '/community', example: '/community', category: 'Əsas', description_az: 'İcma bölməsini açır' },
  { key: 'profile', label: 'Profile', label_az: 'Profil', pattern: '/profile', example: '/profile', category: 'Əsas', description_az: 'Profil bölməsini açır' },
  { key: 'cakes', label: 'Cakes', label_az: 'Tortlar', pattern: '/cakes', example: '/cakes', category: 'Əsas', description_az: 'Tortlar bölməsini açır' },

  // ─── Tools ───
  { key: 'tool', label: 'Specific Tool', label_az: 'Spesifik Alət', pattern: '/tool/{tool_id}', example: '/tool/baby-names', category: 'Alətlər', description_az: 'Müəyyən bir aləti açır' },

  // ─── Screens ───
  { key: 'premium', label: 'Premium', label_az: 'Premium', pattern: '/premium', example: '/premium', category: 'Ekranlar', description_az: 'Premium paywall-u açır' },
  { key: 'settings', label: 'Settings', label_az: 'Tənzimləmələr', pattern: '/settings', example: '/settings', category: 'Ekranlar', description_az: 'Tənzimləmələri açır' },
  { key: 'notifications', label: 'Notifications', label_az: 'Bildirişlər', pattern: '/notifications', example: '/notifications', category: 'Ekranlar', description_az: 'Bildirişləri açır' },
  { key: 'calendar', label: 'Calendar', label_az: 'Təqvim', pattern: '/calendar', example: '/calendar', category: 'Ekranlar', description_az: 'Təqvimi açır' },
  { key: 'help', label: 'Help', label_az: 'Kömək', pattern: '/help', example: '/help', category: 'Ekranlar', description_az: 'Kömək bölməsini açır' },
  { key: 'edit-profile', label: 'Edit Profile', label_az: 'Profil Redaktə', pattern: '/edit-profile', example: '/edit-profile', category: 'Ekranlar', description_az: 'Profil redaktə səhifəsini açır' },
  { key: 'appearance', label: 'Appearance', label_az: 'Görünüş', pattern: '/appearance', example: '/appearance', category: 'Ekranlar', description_az: 'Görünüş tənzimləmələrini açır' },

  // ─── Blog ───
  { key: 'blog', label: 'Blog', label_az: 'Bloq', pattern: '/blog', example: '/blog', category: 'Məzmun', description_az: 'Bloq bölməsini açır' },
  { key: 'blog-post', label: 'Blog Post', label_az: 'Bloq Yazısı', pattern: '/blog/{slug}', example: '/blog/my-article', category: 'Məzmun', description_az: 'Müəyyən bir bloq yazısını açır' },

  // ─── Messages ───
  { key: 'messages', label: 'Messages', label_az: 'Mesajlar', pattern: '/messages', example: '/messages', category: 'Mesajlar', description_az: 'Mesajlar siyahısını açır' },
  { key: 'messages-user', label: 'Chat with User', label_az: 'İstifadəçi ilə Söhbət', pattern: '/messages/{user_id}', example: '/messages/abc-123', category: 'Mesajlar', description_az: 'Müəyyən bir istifadəçi ilə söhbəti açır' },

  // ─── Community ───
  { key: 'community-post', label: 'Community Post', label_az: 'İcma Paylaşımı', pattern: '/community/post/{post_id}', example: '/community/post/abc-123', category: 'İcma', description_az: 'Müəyyən bir icma paylaşımını açır' },
  { key: 'user-profile', label: 'User Profile', label_az: 'İstifadəçi Profili', pattern: '/user/{user_id}', example: '/user/abc-123', category: 'İcma', description_az: 'İstifadəçi profilini açır' },

  // ─── Legal ───
  { key: 'legal', label: 'Legal', label_az: 'Hüquqi', pattern: '/legal/{doc_type}', example: '/legal/privacy', category: 'Digər', description_az: 'Hüquqi sənədi açır' },
];

export interface ParsedDeeplink {
  action: string;
  params: Record<string, string>;
}

/**
 * Parse a deeplink URL (both anacan:// and https://app.anacan.az paths)
 */
export function parseDeeplink(url: string): ParsedDeeplink | null {
  let path = '';

  try {
    if (url.startsWith('anacan://')) {
      // anacan://tool/baby-names → /tool/baby-names
      path = '/' + url.replace('anacan://', '');
    } else if (url.includes('app.anacan.az')) {
      const parsed = new URL(url);
      path = parsed.pathname;
    } else if (url.startsWith('/')) {
      path = url;
    } else {
      return null;
    }
  } catch {
    return null;
  }

  // Remove trailing slash
  path = path.replace(/\/$/, '') || '/';

  // Match against routes
  // /tool/{tool_id} → regex /^\/tool\/([^/]+)$/
  if (path === '/') return { action: 'tab', params: { tab: 'home' } };
  if (path === '/tools') return { action: 'tab', params: { tab: 'tools' } };
  if (path === '/ai') return { action: 'tab', params: { tab: 'ai' } };
  if (path === '/community') return { action: 'tab', params: { tab: 'community' } };
  if (path === '/profile') return { action: 'tab', params: { tab: 'profile' } };
  if (path === '/cakes') return { action: 'tab', params: { tab: 'cakes' } };

  // Tool
  const toolMatch = path.match(/^\/tool\/([^/]+)$/);
  if (toolMatch) return { action: 'tool', params: { tool_id: toolMatch[1] } };

  // Screens
  if (path === '/premium') return { action: 'screen', params: { screen: 'billing' } };
  if (path === '/settings') return { action: 'screen', params: { screen: 'settings' } };
  if (path === '/notifications') return { action: 'screen', params: { screen: 'notifications' } };
  if (path === '/calendar') return { action: 'screen', params: { screen: 'calendar' } };
  if (path === '/help') return { action: 'screen', params: { screen: 'help' } };
  if (path === '/edit-profile') return { action: 'screen', params: { screen: 'edit-profile' } };
  if (path === '/appearance') return { action: 'screen', params: { screen: 'appearance' } };

  // Blog
  if (path === '/blog') return { action: 'screen', params: { screen: 'blog' } };
  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) return { action: 'screen', params: { screen: `blog/${blogMatch[1]}` } };

  // Messages
  if (path === '/messages') return { action: 'messages', params: {} };
  const msgMatch = path.match(/^\/messages\/([^/]+)$/);
  if (msgMatch) return { action: 'messages', params: { user_id: msgMatch[1] } };

  // Community post
  const postMatch = path.match(/^\/community\/post\/([^/]+)$/);
  if (postMatch) return { action: 'community-post', params: { post_id: postMatch[1] } };

  // User profile
  const userMatch = path.match(/^\/user\/([^/]+)$/);
  if (userMatch) return { action: 'user-profile', params: { user_id: userMatch[1] } };

  // Legal
  const legalMatch = path.match(/^\/legal\/([^/]+)$/);
  if (legalMatch) return { action: 'screen', params: { screen: `legal/${legalMatch[1]}` } };

  return null;
}

/**
 * Generate a deeplink URL
 */
export function generateDeeplink(
  pattern: string,
  params: Record<string, string> = {},
  format: 'scheme' | 'universal' = 'universal'
): string {
  let path = pattern;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`{${key}}`, value);
  }

  if (format === 'scheme') {
    // anacan://tool/baby-names (strip leading /)
    return 'anacan:/' + path;
  }
  // https://app.anacan.az/tool/baby-names
  return 'https://app.anacan.az' + path;
}

/**
 * Initialize native deeplink listener (Capacitor App plugin)
 */
export function initDeeplinkListener(handler: (parsed: ParsedDeeplink) => void) {
  if (!Capacitor.isNativePlatform()) return () => {};

  let cleanup: (() => void) | undefined;

  import('@capacitor/app').then(({ App }) => {
    // Handle app opened via URL (cold start or background)
    const listener = App.addListener('appUrlOpen', (event) => {
      console.log('[Deeplink] URL received:', event.url);
      const parsed = parseDeeplink(event.url);
      if (parsed) {
        handler(parsed);
      }
    });

    cleanup = () => {
      listener.then(l => l.remove());
    };
  }).catch(err => {
    console.warn('[Deeplink] Failed to init listener:', err);
  });

  return () => cleanup?.();
}
