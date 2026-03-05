import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  applicable_to: string[];
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
}

export interface AppliedCoupon {
  coupon: Coupon;
  discountAmount: number;
}

export const useCouponValidator = (orderType: string = 'shop') => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [validating, setValidating] = useState(false);

  const validateCoupon = async (code: string, orderTotal: number): Promise<AppliedCoupon | null> => {
    if (!user || !code.trim()) return null;
    setValidating(true);

    try {
      const { data, error } = await supabase
        .from('coupons' as any)
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast({ title: 'Kupon tapılmadı', description: 'Bu kupon kodu mövcud deyil', variant: 'destructive' });
        return null;
      }

      const coupon = data as unknown as Coupon;

      // Check applicable_to
      if (!coupon.applicable_to.includes(orderType)) {
        toast({ title: 'Kupon keçərsizdir', description: 'Bu kupon bu növ sifariş üçün keçərli deyil', variant: 'destructive' });
        return null;
      }

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast({ title: 'Kupon müddəti bitib', variant: 'destructive' });
        return null;
      }

      // Check start date
      if (new Date(coupon.starts_at) > new Date()) {
        toast({ title: 'Kupon hələ aktiv deyil', variant: 'destructive' });
        return null;
      }

      // Check max uses
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        toast({ title: 'Kupon limiti dolub', variant: 'destructive' });
        return null;
      }

      // Check min order amount
      if (coupon.min_order_amount && orderTotal < coupon.min_order_amount) {
        toast({ title: 'Minimum məbləğ', description: `Bu kupon minimum ${coupon.min_order_amount}₼ sifariş üçün keçərlidir`, variant: 'destructive' });
        return null;
      }

      // Check if user already used this coupon
      const { data: usage } = await supabase
        .from('coupon_usage' as any)
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('user_id', user.id);

      if (usage && (usage as any[]).length > 0) {
        toast({ title: 'Artıq istifadə edilib', description: 'Bu kuponu artıq istifadə etmisiniz', variant: 'destructive' });
        return null;
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (orderTotal * coupon.discount_value) / 100;
      } else {
        discountAmount = Math.min(coupon.discount_value, orderTotal);
      }

      discountAmount = Math.round(discountAmount * 100) / 100;

      const applied: AppliedCoupon = { coupon, discountAmount };
      setAppliedCoupon(applied);
      toast({ title: 'Kupon tətbiq edildi! ✅', description: `${discountAmount.toFixed(2)}₼ endirim` });
      return applied;
    } catch (err) {
      toast({ title: 'Xəta', description: 'Kupon yoxlanarkən xəta baş verdi', variant: 'destructive' });
      return null;
    } finally {
      setValidating(false);
    }
  };

  const recordUsage = async (orderId?: string) => {
    if (!user || !appliedCoupon) return;
    try {
      await supabase.from('coupon_usage' as any).insert({
        coupon_id: appliedCoupon.coupon.id,
        user_id: user.id,
        order_type: orderType,
        order_id: orderId || null,
        discount_amount: appliedCoupon.discountAmount,
      });
      // Increment used_count
      await supabase
        .from('coupons' as any)
        .update({ used_count: (appliedCoupon.coupon.used_count || 0) + 1 })
        .eq('id', appliedCoupon.coupon.id);
    } catch (err) {
      console.error('Error recording coupon usage:', err);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    validating,
    validateCoupon,
    recordUsage,
    removeCoupon,
  };
};
