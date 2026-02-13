import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentMethod {
  id: string;
  method_key: string;
  label: string;
  label_az: string | null;
  description: string | null;
  description_az: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const usePaymentMethods = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setMethods((data || []) as unknown as PaymentMethod[]);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const getActiveMethods = () => methods.filter(m => m.is_active);

  const updateMethod = async (id: string, updates: Partial<PaymentMethod>) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
      await fetchMethods();
      return true;
    } catch (error) {
      console.error('Error updating payment method:', error);
      return false;
    }
  };

  return { methods, loading, getActiveMethods, updateMethod, refetch: fetchMethods };
};
