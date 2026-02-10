import { useBanners, BannerPlacement, Banner, useIncrementBannerClick } from '@/hooks/useBanners';
import { useSubscription } from '@/hooks/useSubscription';
import { ExternalLink, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface BannerSlotProps {
  placement: BannerPlacement;
  onNavigate?: (screen: string) => void;
  onToolOpen?: (toolId: string) => void;
  className?: string;
}

const BannerSlot = ({ placement, onNavigate, onToolOpen, className = '' }: BannerSlotProps) => {
  const { data: banners, isLoading } = useBanners(placement);
  const { isPremium } = useSubscription();
  const incrementClick = useIncrementBannerClick();

  if (isLoading || !banners?.length) return null;

  // Filter out premium-only banners for non-premium users
  const visibleBanners = banners.filter(b => !b.is_premium_only || isPremium);
  if (!visibleBanners.length) return null;

  const handleBannerClick = (banner: Banner) => {
    incrementClick.mutate(banner.id);
    
    if (!banner.link_url) return;

    switch (banner.link_type) {
      case 'external':
        window.open(banner.link_url, '_blank');
        break;
      case 'internal':
        if (onNavigate) {
          const screen = banner.link_url.replace('/', '');
          onNavigate(screen);
        }
        break;
      case 'tool':
        if (onToolOpen) {
          onToolOpen(banner.link_url);
        }
        break;
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {visibleBanners.map((banner) => (
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          {banner.banner_type === 'native' ? (
            <NativeBanner banner={banner} onClick={() => handleBannerClick(banner)} />
          ) : (
            <ImageBanner banner={banner} onClick={() => handleBannerClick(banner)} />
          )}
        </motion.div>
      ))}
    </div>
  );
};

interface BannerItemProps {
  banner: Banner;
  onClick: () => void;
}

const NativeBanner = ({ banner, onClick }: BannerItemProps) => {
  const bgColor = banner.background_color || '#F48155';
  const textColor = banner.text_color || '#FFFFFF';

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl p-4 flex items-center gap-4 transition-transform active:scale-[0.98] shadow-lg"
      style={{ 
        background: `linear-gradient(135deg, ${bgColor} 0%, ${adjustColor(bgColor, -20)} 100%)`,
        color: textColor 
      }}
    >
      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-6 h-6" style={{ color: textColor }} />
      </div>
      
      <div className="flex-1 text-left">
        <h3 className="font-semibold text-base" style={{ color: textColor }}>
          {banner.title_az || banner.title}
        </h3>
        {(banner.description_az || banner.description) && (
          <p className="text-sm opacity-90 line-clamp-1" style={{ color: textColor }}>
            {banner.description_az || banner.description}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0">
        {(banner.button_text_az || banner.button_text) && (
          <span className="text-sm font-medium hidden sm:block" style={{ color: textColor }}>
            {banner.button_text_az || banner.button_text}
          </span>
        )}
        {banner.link_type === 'external' ? (
          <ExternalLink className="w-5 h-5" style={{ color: textColor }} />
        ) : (
          <ChevronRight className="w-5 h-5" style={{ color: textColor }} />
        )}
      </div>
    </button>
  );
};

const ImageBanner = ({ banner, onClick }: BannerItemProps) => {
  if (!banner.image_url) return null;

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden transition-transform active:scale-[0.98] shadow-lg relative"
    >
      <img 
        src={banner.image_url} 
        alt={banner.title_az || banner.title}
        className="w-full h-auto object-cover"
      />
      {banner.link_type === 'external' && (
        <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5">
          <ExternalLink className="w-4 h-4 text-white" />
        </div>
      )}
    </button>
  );
};

// Helper function to darken/lighten colors
function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

export default BannerSlot;
