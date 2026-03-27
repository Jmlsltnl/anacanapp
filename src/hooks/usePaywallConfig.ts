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
  savings_badge: string;
  yearly_suffix: string;
  monthly_suffix: string;
  yearly_total_suffix: string;
  // Feature lock text
  feature_lock_text: string;
  // Footer
  restore_text: string;
  terms_label: string;
  privacy_label: string;
  cancel_notice: string;
  native_notice: string;
  non_native_notice: string;
  // Free trial
  free_trial_enabled: boolean;
  free_trial_days: number;
  free_trial_badge: string;
  free_trial_cta: string;
  free_trial_note: string;
  // Purchasing states
  purchasing_text: string;
  // Gradient colors
  gradient_from: string;
  gradient_via: string;
  gradient_to: string;
}

export interface BillingConfig {
  // Header
  page_title: string;
  // Plan names
  free_plan_name: string;
  premium_monthly_name: string;
  premium_yearly_name: string;
  // Status badges
  active_badge: string;
  cancelled_badge: string;
  // Date labels
  start_date_label: string;
  renewal_label: string;
  expiry_label: string;
  // Cancelled notice template
  cancelled_notice: string; // {date} placeholder
  // Features section
  features_title: string;
  features: { icon: string; text: string }[];
  // CTA buttons
  upgrade_cta: string;
  upgrade_savings: string; // {percent} placeholder
  restore_cta: string;
  cancel_cta: string;
  get_premium_cta: string;
  // Payment history
  payment_title: string;
  paid_label: string;
  // Support
  support_text: string;
  support_email: string;
  // Header gradient (premium)
  header_gradient_from: string;
  header_gradient_via: string;
  header_gradient_to: string;
  // Header gradient (free)
  header_free_from: string;
  header_free_via: string;
  header_free_to: string;
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

export const defaultBillingConfig: BillingConfig = {
  page_title: 'Abunəliyim',
  free_plan_name: 'Pulsuz Plan',
  premium_monthly_name: 'Premium Aylıq',
  premium_yearly_name: 'Premium İllik',
  active_badge: 'Aktiv',
  cancelled_badge: 'Ləğv edilib',
  start_date_label: 'Başlama',
  renewal_label: 'Yenilənmə',
  expiry_label: 'Premium bitir',
  cancelled_notice: '{date} tarixinə qədər Premium aktiv qalacaq.',
  features_title: 'Planınıza daxildir',
  features: [
    { icon: 'Zap', text: 'Limitsiz AI' },
    { icon: 'Shield', text: 'Reklamsız' },
    { icon: 'Crown', text: 'Premium fonlar' },
    { icon: 'Sparkles', text: 'Prioritet dəstək' },
  ],
  upgrade_cta: 'İllik Plana Keç',
  upgrade_savings: '{percent}% qənaət',
  restore_cta: 'Abunəliyi Bərpa Et',
  cancel_cta: 'Abunəliyi Ləğv Et',
  get_premium_cta: 'Premium-a Keç',
  payment_title: 'Son ödəniş',
  paid_label: 'Ödənildi',
  support_text: 'Suallarınız üçün:',
  support_email: 'info@anacan.az',
  header_gradient_from: '#d97706',
  header_gradient_via: '#ea580c',
  header_gradient_to: '#be123c',
  header_free_from: '#475569',
  header_free_via: '#334155',
  header_free_to: '#1e293b',
};

export const usePaywallConfig = (): PaywallConfig => {
  const raw = useAppSetting('premium_paywall_config');
  if (!raw || typeof raw !== 'object') return defaultPaywallConfig;
  return { ...defaultPaywallConfig, ...raw };
};

export const useBillingConfig = (): BillingConfig => {
  const raw = useAppSetting('billing_page_config');
  if (!raw || typeof raw !== 'object') return defaultBillingConfig;
  return { ...defaultBillingConfig, ...raw };
};

export const useUpdatePaywallConfig = () => {
  const updateSetting = useUpdateAppSetting();
  return {
    update: (config: PaywallConfig) => updateSetting.mutateAsync({ key: 'premium_paywall_config', value: config }),
    isPending: updateSetting.isPending,
  };
};

export const useUpdateBillingConfig = () => {
  const updateSetting = useUpdateAppSetting();
  return {
    update: (config: BillingConfig) => updateSetting.mutateAsync({ key: 'billing_page_config', value: config }),
    isPending: updateSetting.isPending,
  };
};
