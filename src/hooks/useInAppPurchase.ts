import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { IAP_PRODUCTS, IAP_PLANS, IAPProduct, IAPTransaction, isNativePlatform } from '@/lib/iap';

interface UseInAppPurchaseReturn {
  products: IAPProduct[];
  isLoading: boolean;
  isPurchasing: boolean;
  error: string | null;
  isSupported: boolean;
  purchaseMonthly: () => Promise<boolean>;
  purchaseYearly: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  manageSubscriptions: () => Promise<void>;
}

export function useInAppPurchase(): UseInAppPurchaseReturn {
  const { user } = useAuth();
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [NativePurchases, setNativePurchases] = useState<any>(null);

  // Initialize IAP
  useEffect(() => {
    const initializeIAP = async () => {
      if (!isNativePlatform()) {
        setIsLoading(false);
        return;
      }

      try {
        // Dynamically import the plugin only on native platforms
        const { NativePurchases: NP, PURCHASE_TYPE } = await import('@capgo/native-purchases');
        setNativePurchases(NP);

        // Check if billing is supported
        const { isBillingSupported } = await NP.isBillingSupported();
        setIsSupported(isBillingSupported);

        if (!isBillingSupported) {
          setError('Ödəniş sistemi dəstəklənmir');
          setIsLoading(false);
          return;
        }

        // Load products
        const { products: loadedProducts } = await NP.getProducts({
          productIdentifiers: [IAP_PRODUCTS.PREMIUM_MONTHLY, IAP_PRODUCTS.PREMIUM_YEARLY],
          productType: PURCHASE_TYPE.SUBS,
        });

        const formattedProducts: IAPProduct[] = loadedProducts.map((p: any) => ({
          productId: p.productId,
          title: p.title,
          description: p.description,
          price: p.price,
          priceAmount: p.priceAmountMicros / 1000000,
          currency: p.priceCurrencyCode,
        }));

        setProducts(formattedProducts);

        // Set up transaction listener for iOS
        if (Capacitor.getPlatform() === 'ios') {
          NP.addListener('purchaseCompleted' as any, (event: any) => {
            if (event?.transaction) {
              handleTransaction(event.transaction);
            }
          });
        }
      } catch (err) {
        console.error('IAP initialization error:', err);
        setError('Ödəniş sistemi yüklənə bilmədi');
      } finally {
        setIsLoading(false);
      }
    };

    initializeIAP();

    return () => {
      // Cleanup listener
      if (NativePurchases && Capacitor.getPlatform() === 'ios') {
        NativePurchases.removeAllListeners();
      }
    };
  }, []);

  const handleTransaction = useCallback(async (transaction: IAPTransaction) => {
    console.log('Transaction updated:', transaction);
    await processTransaction(transaction);
  }, [user]);

  const processTransaction = async (transaction: IAPTransaction) => {
    if (!user) return;

    try {
      // Determine plan type from product ID
      const planType = transaction.productId === IAP_PRODUCTS.PREMIUM_YEARLY 
        ? 'premium_plus' 
        : 'premium';

      // Calculate expiration date
      const expiresAt = new Date();
      if (transaction.productId === IAP_PRODUCTS.PREMIUM_YEARLY) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // Update subscription in database
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan_type: planType,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        }, { onConflict: 'user_id' });

      if (subError) throw subError;

      // Update profile premium status
      await supabase
        .from('profiles')
        .update({ 
          is_premium: true,
          premium_until: expiresAt.toISOString(),
        })
        .eq('user_id', user.id);

      // Validate on server (optional - for receipt validation)
      await validatePurchaseOnServer(transaction);
    } catch (err) {
      console.error('Error processing transaction:', err);
    }
  };

  const validatePurchaseOnServer = async (transaction: IAPTransaction) => {
    try {
      await supabase.functions.invoke('validate-purchase', {
        body: {
          transactionId: transaction.transactionId,
          productId: transaction.productId,
          receipt: transaction.receipt,
          purchaseToken: transaction.purchaseToken,
          platform: Capacitor.getPlatform(),
        },
      });
    } catch (err) {
      console.error('Server validation error:', err);
      // Don't throw - local processing already succeeded
    }
  };

  const executePurchase = async (productId: string, planId: string): Promise<boolean> => {
    if (!NativePurchases) {
      console.error('IAP: NativePurchases plugin not loaded');
      setError('Ödəniş sistemi yüklənməyib. Tətbiqi yenidən başladın.');
      return false;
    }
    if (!isSupported) {
      console.error('IAP: Billing not supported on this device');
      setError('Bu cihazda ödəniş dəstəklənmir.');
      return false;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      const { PURCHASE_TYPE } = await import('@capgo/native-purchases');
      
      console.log('IAP: Starting purchase for', productId, 'plan:', planId);
      
      const transaction = await NativePurchases.purchaseProduct({
        productIdentifier: productId,
        planIdentifier: planId,
        productType: PURCHASE_TYPE.SUBS,
        quantity: 1,
        appAccountToken: user?.id,
      });

      console.log('IAP: Purchase completed, transaction:', JSON.stringify(transaction));

      if (transaction && transaction.transactionId) {
        await processTransaction(transaction);
        return true;
      } else {
        console.error('IAP: No valid transaction returned', transaction);
        setError('Alış tamamlana bilmədi. Yenidən cəhd edin.');
        return false;
      }
    } catch (err: any) {
      console.error('IAP: Purchase error:', err, JSON.stringify(err));
      if (err?.code === 'USER_CANCELLED' || err?.message?.includes('cancel')) {
        setError(null);
      } else {
        setError(`Alış zamanı xəta: ${err?.message || 'Naməlum xəta'}`);
      }
      return false;
    } finally {
      setIsPurchasing(false);
    }
  };

  const purchaseMonthly = async (): Promise<boolean> => {
    return executePurchase(IAP_PRODUCTS.PREMIUM_MONTHLY, IAP_PLANS.MONTHLY_PLAN);
  };

  const purchaseYearly = async (): Promise<boolean> => {
    return executePurchase(IAP_PRODUCTS.PREMIUM_YEARLY, IAP_PLANS.YEARLY_PLAN);
  };

  const restorePurchases = async (): Promise<boolean> => {
    if (!NativePurchases || !isSupported) return false;

    setIsLoading(true);
    setError(null);

    try {
      await NativePurchases.restorePurchases();
      
      const { PURCHASE_TYPE } = await import('@capgo/native-purchases');
      const { purchases } = await NativePurchases.getPurchases({
        productType: PURCHASE_TYPE.SUBS,
      });

      if (purchases && purchases.length > 0) {
        // Process the most recent purchase
        const latestPurchase = purchases[purchases.length - 1];
        await processTransaction(latestPurchase);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Restore error:', err);
      setError('Alışlar bərpa edilə bilmədi');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const manageSubscriptions = async (): Promise<void> => {
    if (!NativePurchases || !isSupported) return;

    try {
      await NativePurchases.manageSubscriptions();
    } catch (err) {
      console.error('Manage subscriptions error:', err);
    }
  };

  return {
    products,
    isLoading,
    isPurchasing,
    error,
    isSupported,
    purchaseMonthly,
    purchaseYearly,
    restorePurchases,
    manageSubscriptions,
  };
}
