import { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { clearTranslationCache, loadTranslations } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';

const LANGS = [
  { code: 'az', label: 'Azərbaycan', native: 'Azərbaycan' },
  { code: 'en', label: 'English', native: 'English' },
];

export default function LanguageSelector() {
  const language = useUserStore(state => state.language);
  const setLanguage = useUserStore(state => state.setLanguage);
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [switching, setSwitching] = useState(false);

  // Feature flag check
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'language_switcher_enabled')
        .maybeSingle();
      const isOn = data?.value === true || data?.value === 'true';
      setEnabled(isOn);
      if (!isOn && language !== 'az') {
        setLanguage('az');
        clearTranslationCache();
      }
    })();
  }, []);

  const change = async (code: string) => {
    if (code === language) { setOpen(false); return; }
    setSwitching(true);
    clearTranslationCache();
    if (code !== 'az') await loadTranslations(code);
    setLanguage(code);
    // Persist to user_preferences so server-side (cron, edge fns) honors the choice
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_preferences')
          .upsert({ user_id: user.id, language: code }, { onConflict: 'user_id' });
      }
    } catch (e) { console.warn('lang persist failed', e); }
    setSwitching(false);
    setOpen(false);
    // Force re-render of the app
    setTimeout(() => window.location.reload(), 50);
  };

  if (!enabled) return null;

  const current = LANGS.find(l => l.code === language) ?? LANGS[0];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between p-3 rounded-2xl bg-card hover:bg-muted/40 transition-colors border border-border"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-foreground">Dil / Language</div>
            <div className="text-xs text-muted-foreground">{current.native}</div>
          </div>
        </div>
        <span className="text-xs font-semibold text-primary uppercase">{current.code}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
          onClick={() => !switching && setOpen(false)}
        >
          <div
            className="bg-card w-full max-w-sm rounded-3xl p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-foreground mb-3 px-1">Dil / Language</h3>
            <div className="space-y-2">
              {LANGS.map(l => (
                <button
                  key={l.code}
                  disabled={switching}
                  onClick={() => change(l.code)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                    l.code === language
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <div className="text-left">
                    <div className="text-sm font-semibold text-foreground">{l.native}</div>
                    <div className="text-[11px] text-muted-foreground uppercase">{l.code}</div>
                  </div>
                  {l.code === language && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/70 mt-3 px-1 leading-relaxed">
              Dili dəyişdikdən sonra tətbiq yenilənəcək. / The app will reload after changing language.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
