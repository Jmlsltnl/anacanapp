

# Resept CSV Import Probleminin Həlli

## Problem
`parseCSVLine` funksiyası sadə sətir-sətir bölmə (`text.split('\n')`) istifadə edir. Əgər CSV-dəki quoted sahələrdə (məs. inqredientlər, hazırlanma) daxili sətir keçidləri varsa, bunlar ayrı sətir kimi sayılır. 153 resept 374-ə çevrilir çünki hər daxili `\n` yeni sətir yaradır.

## Həll Yolu

### `src/components/admin/AdminRecipes.tsx`
1. **Yeni CSV parser funksiyası** yazılacaq — `splitCSVIntoRows()` — quoted sahələrdəki newline-ları nəzərə alacaq
2. Mövcud `text.split('\n')` əvəzinə bu funksiya istifadə ediləcək
3. `parseCSVLine` funksiyası da `""` (escaped quotes) dəstəkləyəcək şəkildə yenilənəcək

### Texniki Detal
```text
Mövcud axın:
  text.split('\n') → hər sətri ayrı row sayır → 374 sətir

Yeni axın:
  splitCSVIntoRows(text) → quoted newline-ları saxlayır → 153 row
```

Parser dəyişikliyi yalnız `handleCSVUpload` funksiyasında olacaq, digər heç nəyə təsir etməyəcək.

