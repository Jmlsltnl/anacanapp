import { tr } from '@/lib/tr';

export interface LifeStageMeta {
  label: string;
  bg: string;
  ink: string;
}

/**
 * Community-də (post/şərh/profil) istifadəçinin hansı modulda olduğunu göstərən
 * kiçik etiket — TƏK mənbə (əvvəllər UserProfileScreen.tsx-də lokal təkrarlanırdı,
 * indi PostCard/CommentReply də eyni mappingi istifadə edir ki, rənglər/adlar
 * bütün Community boyu identik qalsın).
 */
export function getLifeStageMeta(stage?: string | null): LifeStageMeta | null {
  switch (stage) {
    case 'flow':
      return { label: 'Flow', bg: 'var(--a-pink-1)', ink: 'var(--a-pink-ink)' };
    case 'bump':
      return { label: tr('userprofilescreen_hamile_0080af', 'Hamilə'), bg: 'var(--a-peach-1)', ink: 'var(--a-accent-ink)' };
    case 'mommy':
      return { label: tr('common_ana', 'Ana'), bg: 'var(--a-lav-1)', ink: 'var(--a-lav-ink)' };
    case 'partner':
      return { label: 'Partner', bg: 'var(--a-blue-1)', ink: 'var(--a-blue-ink)' };
    default:
      return null;
  }
}
