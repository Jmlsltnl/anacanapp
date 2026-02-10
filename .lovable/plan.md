
# Profil Redaktəsində Hamiləlik Tarixlərinin Düzəldilməsi

## Problem Təhlili
Hazırda profil redaktəsində hamiləlik mərhələsinə keçəndə yalnız "Təxmini doğuş tarixi" istənilir, lakin Dashboard bütün hesablamaları **son menstruasiya tarixi (LMP)** əsasında edir. Bu səbəbdən:
- Dashboard-da həftə sayı görünmür
- Gün hesablamaları işləmir
- Proqres barı boş qalır

## Həll Planı

### 1. ProfileEditScreen UI Təkmilləşdirməsi
**Yeni seçim sistemi:**
- İstifadəçi ya "Son menstruasiya tarixi" (LMP), ya da "Təxmini doğuş tarixi" seçə bilsin
- Hansı birini daxil etsə, digəri avtomatik hesablansın (±280 gün)
- Daha aydın UI - toggle düymələri ilə

```
┌─────────────────────────────────────────┐
│  Hamiləlik Məlumatları                  │
├─────────────────────────────────────────┤
│  Tarix növünü seçin:                    │
│  ┌──────────────┐ ┌──────────────────┐  │
│  │ 📅 Son adet  │ │ 🎯 Doğuş tarixi │  │
│  │   tarixi     │ │                  │  │
│  └──────────────┘ └──────────────────┘  │
│                                         │
│  [____________ Tarix seçin ___________] │
│                                         │
│  ✨ Hesablanan doğuş tarixi: XX.XX.XXXX │
│     və ya                               │
│  ✨ Hesablanan LMP: XX.XX.XXXX          │
└─────────────────────────────────────────┘
```

### 2. Backend Məntiq
**ProfileEditScreen.tsx dəyişiklikləri:**

- Yeni state əlavə ediləcək: `dateInputMode: 'lmp' | 'dueDate'`
- Tarix daxil edildikdə avtomatik hesablama:
  - LMP seçildikdə: `dueDate = LMP + 280 gün`
  - Due date seçildikdə: `LMP = dueDate - 280 gün`
- Supabase-ə hər iki tarix yadda saxlanacaq

**handleSave funksiyası:**
```typescript
if (formData.life_stage === 'bump') {
  let effectiveLMP: string;
  let effectiveDueDate: string;
  
  if (dateInputMode === 'lmp') {
    effectiveLMP = formData.last_period_date;
    effectiveDueDate = hesabla(LMP + 280 gün);
  } else {
    effectiveDueDate = formData.due_date;
    effectiveLMP = hesabla(dueDate - 280 gün);
  }
  
  updateData.last_period_date = effectiveLMP;
  updateData.due_date = effectiveDueDate;
}
```

### 3. Zustand Store Sinxronizasiyası
**handleSave-də local store yenilənməsi:**
- `setLastPeriodDate(new Date(effectiveLMP))`
- `setDueDate(new Date(effectiveDueDate))`
- Bu Dashboard-ın dərhal yenilənməsini təmin edər

### 4. AuthContext Yoxlaması
Mövcud `syncProfileToStore` funksiyası artıq düzgün işləyir - heç bir dəyişiklik lazım deyil.

---

## Texniki Detallar

### Dəyişiklik ediləcək fayllar:
1. **src/components/ProfileEditScreen.tsx**
   - Toggle state əlavə edilməsi
   - UI yenilənməsi - tarix növü seçimi
   - Avtomatik hesablama funksiyası
   - handleSave-də hər iki tarixi saxlama

### Hesablama formulu:
```typescript
// pregnancy-utils.ts-dən istifadə
import { calculateDueDate } from '@/lib/pregnancy-utils';

// Due date-dən LMP hesablama (tərsinə)
const calculateLMPFromDueDate = (dueDate: Date): Date => {
  return new Date(dueDate.getTime() - 280 * 24 * 60 * 60 * 1000);
};
```

### Yeni UI komponentləri:
- Toggle button qrupu (LMP / Due Date seçimi)
- Hesablanmış tarixi göstərən info kartı
- Validasiya mesajları

### Test ssenariləri:
1. İstifadəçi LMP daxil edir → due date avtomatik görünür
2. İstifadəçi due date daxil edir → LMP avtomatik hesablanır
3. Saxladıqdan sonra Dashboard düzgün həftə göstərir
4. Səhifə yenilənəndə məlumatlar qalır
