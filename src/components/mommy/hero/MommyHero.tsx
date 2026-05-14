import { useAppSetting } from '@/hooks/useAppSettings';
import MommyHeroClassic, { MommyHeroProps } from './MommyHeroClassic';
import MommyHeroAurora from './MommyHeroAurora';
import MommyHeroStorybook from './MommyHeroStorybook';

export type MommyHeroVariant = 'classic' | 'aurora' | 'storybook';

/**
 * Reads the selected variant from app_settings.mommy_hero_variant
 * (admin-controlled via Tənzimləmələr → Mommy Hero) and renders that variant.
 * Defaults to "classic" so existing users see no change until the admin switches.
 */
const MommyHero = (props: MommyHeroProps) => {
  const variantSetting = useAppSetting('mommy_hero_variant');
  const variant: MommyHeroVariant =
    variantSetting === 'aurora' || variantSetting === 'storybook'
      ? variantSetting
      : 'classic';

  if (variant === 'aurora') return <MommyHeroAurora {...props} />;
  if (variant === 'storybook') return <MommyHeroStorybook {...props} />;
  return <MommyHeroClassic {...props} />;
};

export default MommyHero;
