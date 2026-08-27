import { useRef, useCallback, useEffect } from 'react';

/**
 * Textarea-nı yazılan mətnin uzunluğuna görə avtomatik AŞAĞI doğru böyüdür
 * (WhatsApp/iMessage/Instagram-tipli mesaj qutuları kimi) — istifadəçi uzun
 * mətn yazanda sətir tək bir sətirdə sıxılıb üfüqi görünməz qalmır, əvəzinə
 * qutu şaquli böyüyür. `maxHeightPx`-ə çatanda daxili scroll işə düşür ki,
 * çox uzun mətnlər ekranı doldurmasın.
 *
 * İstifadə:
 *   const { ref } = useAutoGrowTextarea(text);
 *   <textarea ref={ref} value={text} onChange={...} rows={1} style={{ resize: 'none' }} />
 */
export function useAutoGrowTextarea(value: string, maxHeightPx = 120) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, maxHeightPx);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeightPx ? 'auto' : 'hidden';
  }, [maxHeightPx]);

  useEffect(() => {
    resize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return { ref, resize };
}
