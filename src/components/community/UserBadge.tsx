import { Shield, Sparkles, BadgeCheck } from 'lucide-react';

/**
 * Paylaşılan community "author badge" komponentləri — əvvəllər PostCard.tsx
 * və CommentReply.tsx eyni konsepti iki fərqli stildə (CSS class vs Tailwind
 * gradient) ayrıca təkrarlayırdı. İndi hər ikisi buradan istifadə edir ki,
 * post və şərh görünüşləri tam vizual uyğunluqda olsun.
 */

export type BadgeType = 'admin' | 'premium' | 'moderator' | null | undefined;

const BADGE_CONFIG: Record<string, { label: string; icon: typeof Shield; className: string }> = {
  admin: { label: 'Admin', icon: Shield, className: 'admin' },
  premium: { label: 'Premium', icon: Sparkles, className: '' },
  moderator: { label: 'Mod', icon: Shield, className: 'moderator' }
};

export const UserBadge = ({ type }: { type: BadgeType }) => {
  if (!type) return null;
  const b = BADGE_CONFIG[type];
  if (!b) return null;
  const Icon = b.icon;
  return (
    <span className={`a-post-badge ${b.className}`}>
      <Icon size={9} />
      {b.label}
    </span>
  );
};

/**
 * Mavi tik (Instagram-tipli "verified" nişanı) — göy dairə + ağ ✓.
 * BadgeCheck ikonunda `fill` = dairənin göy dolğusu, `color` = ✓ xəttinin
 * (və dairə konturunun) rəngi — ikonun öz strukturu buna görə iki rəngli görünür.
 */
export const VerifiedTick = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <BadgeCheck
    size={size}
    strokeWidth={2.25}
    fill="#0095F6"
    color="#ffffff"
    className={`a-verified-tick ${className}`}
    aria-label="Təsdiqlənmiş hesab"
  />
);

/**
 * Mavi tik yalnız `is_verified=true` VƏ (müddət yoxdursa daimi, ya da
 * müddət hələ bitməyibsə) aktivdir. Bu hesablama client-side aparılır —
 * ayrıca "expire" cron/edge function lazım deyil, bayrağın özü DB-də qalır,
 * sadəcə görüntü anında müddət yoxlanılır.
 */
export const isVerifiedActive = (isVerified?: boolean | null, verifiedUntil?: string | null): boolean => {
  if (!isVerified) return false;
  if (!verifiedUntil) return true; // daimi
  return new Date(verifiedUntil).getTime() > Date.now();
};
