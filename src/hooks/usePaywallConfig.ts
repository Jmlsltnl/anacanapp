import { useAppSetting, useUpdateAppSetting } from '@/hooks/useAppSettings';

export interface PaywallConfig {
  // Branding
  title: string;
  subtitle: string;
  // Benefit pills
  pills: { icon: string; text: string }[];
  // CTA texts
  cta_new_user: string;
  cta_upgrade: string;
  cta_switch_yearly: string;
  // Plan labels
  yearly_label: string;
  monthly_label: string;
  savings_badge: string; // e.g. "{percent}% QƏNAƏT"
  yearly_suffix: string;
  monthly_suffix: string;
  yearly_total_suffix: string;
  // Feature lock text
  feature_lock_text: string; // e.g. "{feature} üçün Premium lazımdır"
  // Footer
  restore_text: string;
  terms_label: string;
  privacy_label: string;
  cancel_notice: string;
  native_notice: string;
  non_native_notice: string;
  // Purchasing states
  purchasing_text: string;
  // Gradient colors
  gradient_from: string;
  gradient_via: string;
  gradient_to: string;
}

export const defaultPaywallConfig: PaywallConfig = {
  title: 'Anacan Premium',
  subtitle: 'Tam təcrübə · Sınırsız imkanlar',
  pills: [
    { icon: 'Zap', text: 'Limitsiz' },
    { icon: 'Shield', text: 'Reklamsız' },
    { icon: 'Sparkles', text: 'AI dəstəyi' },
  ],
  cta_new_user: 'Premium-a Keç',
  cta_upgrade: 'Planı Yenilə',
  cta_switch_yearly: 'İllik Plana Keç',
  yearly_label: 'İllik',
  monthly_label: 'Aylıq',
  savings_badge: '{percent}% QƏNAƏT',
  yearly_suffix: '/ay',
  monthly_suffix: '/ay',
  yearly_total_suffix: '/il',
  feature_lock_text: '{feature} üçün Premium lazımdır',
  restore_text: 'Bərpa et',
  terms_label: 'Şərtlər',
  privacy_label: 'Məxfilik',
  cancel_notice: 'İstənilən vaxt ləğv edə bilərsiniz • Avtomatik yenilənir',
  native_notice: '',
  non_native_notice: 'App Store / Google Play-dən yükləyin',
  purchasing_text: 'Emal edilir...',
  gradient_from: '#d97706',
  gradient_via: '#ea580c',
  gradient_to: '#be123c',
};

export const usePaywallConfig = (): PaywallConfig => {
  const raw = useAppSetting('premium_paywall_config');
  if (!raw || typeof raw !== 'object') return defaultPaywallConfig;
  return { ...defaultPaywallConfig, ...raw };
};

export const useUpdatePaywallConfig = () => {
  const updateSetting = useUpdateAppSetting();
  return {
    update: (config: PaywallConfig) => updateSetting.mutateAsync({ key: 'premium_paywall_config', value: config }),
    isPending: updateSetting.isPending,
  };
};
