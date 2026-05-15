import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  REVENUECAT_CONFIG,
  REVENUECAT_ENABLED,
  isNativePlatform,
  initRevenueCat,
  getOfferings,
  checkEntitlement,
} from '@/lib/revenuecat';

export default function RevenueCatDebug() {
  const [log, setLog] = useState<string[]>([]);
  const [offerings, setOfferings] = useState<any>(null);
  const [entitlement, setEntitlement] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const append = (s: string) => setLog((p) => [...p, s]);

  const run = async () => {
    setLoading(true);
    setError(null);
    setLog([]);
    try {
      append(`Platform: ${Capacitor.getPlatform()}`);
      append(`isNativePlatform: ${isNativePlatform()}`);
      append(`REVENUECAT_ENABLED: ${REVENUECAT_ENABLED}`);
      append(`Entitlement ID: ${REVENUECAT_CONFIG.ENTITLEMENT_ID}`);
      append(`Android key set: ${REVENUECAT_CONFIG.ANDROID_API_KEY.startsWith('goog_')}`);
      append(`iOS key set: ${REVENUECAT_CONFIG.IOS_API_KEY.startsWith('appl_')}`);

      if (!isNativePlatform()) {
        append('⚠️ Web preview: RevenueCat yalnız native cihazda işləyir. APK/IPA quraşdırın.');
        return;
      }

      append('Initializing RevenueCat...');
      await initRevenueCat();
      append('✅ Init OK');

      append('Fetching offerings...');
      const off = await getOfferings();
      setOfferings(off);
      if (!off) {
        append('❌ Offerings null/undefined');
      } else {
        const allKeys = Object.keys(off?.all || {});
        append(`All offerings: ${allKeys.join(', ') || '(none)'}`);
        append(`Current offering: ${off?.current?.identifier || '(none)'}`);
        const pkgs = off?.current?.availablePackages || [];
        append(`Current packages count: ${pkgs.length}`);
        pkgs.forEach((p: any, i: number) => {
          append(
            `  [${i}] id="${p.identifier}" type="${p.packageType}" → product="${p.product?.identifier}" ${p.product?.priceString} (${p.product?.currencyCode})`
          );
        });
      }

      append('Checking entitlement...');
      const ent = await checkEntitlement();
      setEntitlement(ent);
      append(`isPro: ${ent.isPro} | productId: ${ent.productId} | expires: ${ent.expiresAt}`);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || String(e));
      append(`❌ ERROR: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-32">
      <h1 className="text-xl font-bold mb-2">RevenueCat Debug</h1>
      <button
        onClick={run}
        disabled={loading}
        className="mb-4 px-4 py-2 rounded bg-primary text-primary-foreground text-sm"
      >
        {loading ? 'Loading...' : 'Yenidən yoxla'}
      </button>

      {error && (
        <div className="mb-4 p-3 rounded bg-destructive/10 border border-destructive text-destructive text-sm">
          {error}
        </div>
      )}

      <h2 className="font-semibold mt-4 mb-1 text-sm">Log</h2>
      <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap break-all">
        {log.join('\n')}
      </pre>

      <h2 className="font-semibold mt-4 mb-1 text-sm">Entitlement (raw)</h2>
      <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap break-all">
        {JSON.stringify(entitlement, null, 2)}
      </pre>

      <h2 className="font-semibold mt-4 mb-1 text-sm">Offerings (raw)</h2>
      <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap break-all">
        {JSON.stringify(offerings, null, 2)}
      </pre>
    </div>
  );
}
