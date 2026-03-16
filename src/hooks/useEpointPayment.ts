import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PaymentRequest {
  amount: number;
  orderType: 'cake' | 'shop' | 'album' | 'premium' | 'general';
  orderReferenceId?: string;
  description?: string;
  successUrl?: string;
  errorUrl?: string;
}

interface PaymentResponse {
  success: boolean;
  redirectUrl?: string;
  transactionId?: string;
  orderId?: string;
  error?: string;
}

export const useEpointPayment = () => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);

  const initiatePayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
    if (!user?.id) {
      toast.error('Ödəniş üçün daxil olmalısınız');
      return { success: false, error: 'Not authenticated' };
    }

    setLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const baseUrl = `https://${projectId}.supabase.co/functions/v1`;

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(`${baseUrl}/epoint-payment?action=create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          amount: request.amount,
          orderType: request.orderType,
          orderReferenceId: request.orderReferenceId,
          description: request.description,
          userId: user.id,
          successUrl: request.successUrl || `${window.location.origin}/payment/success`,
          errorUrl: request.errorUrl || `${window.location.origin}/payment/error`,
        }),
      });

      const result = await response.json();

      if (result.success && result.redirectUrl) {
        // Redirect to Epoint payment page
        window.location.href = result.redirectUrl;
        return result;
      } else {
        toast.error(result.error || 'Ödəniş başlatıla bilmədi');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Ödəniş xətası baş verdi');
      return { success: false, error: 'Payment error' };
    } finally {
      setLoading(false);
    }
  };

  return { initiatePayment, loading };
};

export const usePaymentTransactions = (limit = 50) => {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['payment-transactions', user?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useAllPaymentTransactions = (limit = 100) => {
  return useQuery({
    queryKey: ['all-payment-transactions', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
};
