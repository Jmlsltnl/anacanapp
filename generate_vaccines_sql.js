import fs from 'fs';
import crypto from 'crypto';

const VACCINES = {
  HEP_B: {
    code: 'HepB', color_hex: '#3B82F6',
    name_az: 'Hepatit B', name_en: 'Hepatitis B',
    disease_az: 'Hepatit B virusu', disease_en: 'Hepatitis B virus',
    route_az: 'Əzələdaxili', route_en: 'Intramuscular',
  },
  BCG: {
    code: 'BCG', color_hex: '#10B981',
    name_az: 'Vərəm (BCG)', name_en: 'Tuberculosis (BCG)',
    disease_az: 'Vərəm', disease_en: 'Tuberculosis',
    route_az: 'Dəridaxili', route_en: 'Intradermal',
  },
  OPV: {
    code: 'OPV', color_hex: '#F59E0B',
    name_az: 'Poliomielit (OPV)', name_en: 'Polio (OPV)',
    disease_az: 'Poliomielit', disease_en: 'Poliomyelitis',
    route_az: 'Ağızdan (damcı)', route_en: 'Oral (drops)',
  },
  IPV: {
    code: 'IPV', color_hex: '#F59E0B',
    name_az: 'Poliomielit (IPV)', name_en: 'Polio (IPV)',
    disease_az: 'Poliomielit', disease_en: 'Poliomyelitis',
    route_az: 'Əzələdaxili', route_en: 'Intramuscular',
  },
  DTAP: {
    code: 'DTaP', color_hex: '#EF4444',
    name_az: 'Göy öskürək, difteriya, tetanoz', name_en: 'Diphtheria, Tetanus, Pertussis',
    disease_az: 'Göy öskürək, difteriya, tetanoz', disease_en: 'Diphtheria, Tetanus, Pertussis',
    route_az: 'Əzələdaxili', route_en: 'Intramuscular',
  },
  HIB: {
    code: 'HiB', color_hex: '#8B5CF6',
    name_az: 'Hib infeksiyası', name_en: 'Haemophilus influenzae type b',
    disease_az: 'Meningit, pnevmoniya', disease_en: 'Meningitis, pneumonia',
    route_az: 'Əzələdaxili', route_en: 'Intramuscular',
  },
  PCV: {
    code: 'PCV', color_hex: '#EC4899',
    name_az: 'Pnevmokokk', name_en: 'Pneumococcal',
    disease_az: 'Pnevmoniya, meningit', disease_en: 'Pneumonia, meningitis',
    route_az: 'Əzələdaxili', route_en: 'Intramuscular',
  },
  RV: {
    code: 'RV', color_hex: '#14B8A6',
    name_az: 'Rotavirus', name_en: 'Rotavirus',
    disease_az: 'Rotavirus ishalı', disease_en: 'Rotavirus diarrhea',
    route_az: 'Ağızdan', route_en: 'Oral',
  },
  MMR: {
    code: 'MMR', color_hex: '#F43F5E',
    name_az: 'Qızılca, parotit, məxmərək', name_en: 'Measles, Mumps, Rubella',
    disease_az: 'Qızılca, parotit, məxmərək', disease_en: 'Measles, Mumps, Rubella',
    route_az: 'Dərialtı', route_en: 'Subcutaneous',
  },
  VARICELLA: {
    code: 'VAR', color_hex: '#6366F1',
    name_az: 'Su çiçəyi', name_en: 'Varicella (Chickenpox)',
    disease_az: 'Su çiçəyi', disease_en: 'Chickenpox',
    route_az: 'Dərialtı', route_en: 'Subcutaneous',
  },
  HEPA: {
    code: 'HepA', color_hex: '#3B82F6',
    name_az: 'Hepatit A', name_en: 'Hepatitis A',
    disease_az: 'Hepatit A virusu', disease_en: 'Hepatitis A virus',
    route_az: 'Əzələdaxili', route_en: 'Intramuscular',
  },
  MEN: {
    code: 'MenACWY', color_hex: '#F59E0B',
    name_az: 'Meningokokk', name_en: 'Meningococcal',
    disease_az: 'Meningokokk xəstəliyi', disease_en: 'Meningococcal disease',
    route_az: 'Əzələdaxili', route_en: 'Intramuscular',
  },
  HPV: {
    code: 'HPV', color_hex: '#A855F7',
    name_az: 'İnsan papilloma virusu', name_en: 'Human papillomavirus',
    disease_az: 'Uşaqlıq boynu xərçəngi', disease_en: 'Cervical cancer',
    route_az: 'Əzələdaxili', route_en: 'Intramuscular',
  }
};

const COUNTRIES = [
  // ... TR, US, GB, DE, RU ...
  {
    code: 'TR', name_az: 'Türkiyə', name_en: 'Turkey', flag: '🇹🇷',
    source_url: 'https://saglik.gov.tr', source_label: 'T.C. Sağlık Bakanlığı',
    schedules: [
      { v: 'HEP_B', schedules: [{ d: 1, age: 0, a_az: 'Doğulanda', a_en: 'At birth' }, { d: 2, age: 30, a_az: '1 aylıq', a_en: '1 month' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }]},
      { v: 'BCG', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }]},
      { v: 'DTAP', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'IPV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'HIB', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'PCV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 365, a_az: '12 aylıq', a_en: '12 months' }]},
      { v: 'MMR', schedules: [{ d: 1, age: 365, a_az: '12 aylıq', a_en: '12 months' }, { d: 2, age: 1460, a_az: '48 aylıq', a_en: '48 months' }]},
      { v: 'VARICELLA', schedules: [{ d: 1, age: 365, a_az: '12 aylıq', a_en: '12 months' }]},
      { v: 'HEPA', schedules: [{ d: 1, age: 540, a_az: '18 aylıq', a_en: '18 months' }, { d: 2, age: 730, a_az: '24 aylıq', a_en: '24 months' }]}
    ]
  },
  {
    code: 'US', name_az: 'ABŞ', name_en: 'USA', flag: '🇺🇸',
    source_url: 'https://www.cdc.gov/vaccines/schedules/', source_label: 'CDC',
    schedules: [
      { v: 'HEP_B', schedules: [{ d: 1, age: 0, a_az: 'Doğulanda', a_en: 'At birth' }, { d: 2, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }]},
      { v: 'RV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }]},
      { v: 'DTAP', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }, { d: 4, age: 450, a_az: '15 aylıq', a_en: '15 months' }]},
      { v: 'HIB', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }, { d: 4, age: 365, a_az: '12 aylıq', a_en: '12 months' }]},
      { v: 'PCV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }, { d: 4, age: 365, a_az: '12 aylıq', a_en: '12 months' }]},
      { v: 'IPV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }]},
      { v: 'MMR', schedules: [{ d: 1, age: 365, a_az: '12 aylıq', a_en: '12 months' }, { d: 2, age: 1460, a_az: '4-6 yaş', a_en: '4-6 years' }]},
      { v: 'VARICELLA', schedules: [{ d: 1, age: 365, a_az: '12 aylıq', a_en: '12 months' }, { d: 2, age: 1460, a_az: '4-6 yaş', a_en: '4-6 years' }]}
    ]
  },
  {
    code: 'GB', name_az: 'Böyük Britaniya', name_en: 'United Kingdom', flag: '🇬🇧',
    source_url: 'https://www.nhs.uk/conditions/vaccinations/', source_label: 'NHS',
    schedules: [
      { v: 'DTAP', schedules: [{ d: 1, age: 60, a_az: '8 həftə', a_en: '8 weeks' }, { d: 2, age: 90, a_az: '12 həftə', a_en: '12 weeks' }, { d: 3, age: 120, a_az: '16 həftə', a_en: '16 weeks' }, { d: 4, age: 1095, a_az: '3 yaş 4 ay', a_en: '3y 4m' }]},
      { v: 'IPV', schedules: [{ d: 1, age: 60, a_az: '8 həftə', a_en: '8 weeks' }, { d: 2, age: 90, a_az: '12 həftə', a_en: '12 weeks' }, { d: 3, age: 120, a_az: '16 həftə', a_en: '16 weeks' }, { d: 4, age: 1095, a_az: '3 yaş 4 ay', a_en: '3y 4m' }]},
      { v: 'HIB', schedules: [{ d: 1, age: 60, a_az: '8 həftə', a_en: '8 weeks' }, { d: 2, age: 90, a_az: '12 həftə', a_en: '12 weeks' }, { d: 3, age: 120, a_az: '16 həftə', a_en: '16 weeks' }, { d: 4, age: 365, a_az: '1 yaş', a_en: '1 year' }]},
      { v: 'HEP_B', schedules: [{ d: 1, age: 60, a_az: '8 həftə', a_en: '8 weeks' }, { d: 2, age: 90, a_az: '12 həftə', a_en: '12 weeks' }, { d: 3, age: 120, a_az: '16 həftə', a_en: '16 weeks' }]},
      { v: 'RV', schedules: [{ d: 1, age: 60, a_az: '8 həftə', a_en: '8 weeks' }, { d: 2, age: 90, a_az: '12 həftə', a_en: '12 weeks' }]},
      { v: 'PCV', schedules: [{ d: 1, age: 90, a_az: '12 həftə', a_en: '12 weeks' }, { d: 2, age: 365, a_az: '1 yaş', a_en: '1 year' }]},
      { v: 'MMR', schedules: [{ d: 1, age: 365, a_az: '1 yaş', a_en: '1 year' }, { d: 2, age: 1095, a_az: '3 yaş 4 ay', a_en: '3y 4m' }]}
    ]
  },
  {
    code: 'DE', name_az: 'Almaniya', name_en: 'Germany', flag: '🇩🇪',
    source_url: 'https://www.rki.de/', source_label: 'STIKO (RKI)',
    schedules: [
      { v: 'DTAP', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'IPV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'HIB', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'HEP_B', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'PCV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'RV', schedules: [{ d: 1, age: 42, a_az: '6 həftə', a_en: '6 weeks' }, { d: 2, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 3, age: 120, a_az: '4 aylıq', a_en: '4 months' }]},
      { v: 'MMR', schedules: [{ d: 1, age: 330, a_az: '11 aylıq', a_en: '11 months' }, { d: 2, age: 450, a_az: '15 aylıq', a_en: '15 months' }]},
      { v: 'VARICELLA', schedules: [{ d: 1, age: 330, a_az: '11 aylıq', a_en: '11 months' }, { d: 2, age: 450, a_az: '15 aylıq', a_en: '15 months' }]}
    ]
  },
  {
    code: 'RU', name_az: 'Rusiya', name_en: 'Russia', flag: '🇷🇺',
    source_url: 'https://minzdrav.gov.ru/', source_label: 'Минздрав РФ',
    schedules: [
      { v: 'HEP_B', schedules: [{ d: 1, age: 0, a_az: 'Doğulanda', a_en: 'At birth' }, { d: 2, age: 30, a_az: '1 aylıq', a_en: '1 month' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }]},
      { v: 'BCG', schedules: [{ d: 1, age: 3, a_az: '3-7 gün', a_en: '3-7 days' }]},
      { v: 'PCV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 135, a_az: '4.5 aylıq', a_en: '4.5 months' }, { d: 3, age: 450, a_az: '15 aylıq', a_en: '15 months' }]},
      { v: 'DTAP', schedules: [{ d: 1, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 2, age: 135, a_az: '4.5 aylıq', a_en: '4.5 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'IPV', schedules: [{ d: 1, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 2, age: 135, a_az: '4.5 aylıq', a_en: '4.5 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }]},
      { v: 'HIB', schedules: [{ d: 1, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 2, age: 135, a_az: '4.5 aylıq', a_en: '4.5 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'MMR', schedules: [{ d: 1, age: 365, a_az: '12 aylıq', a_en: '12 months' }, { d: 2, age: 2190, a_az: '6 yaş', a_en: '6 years' }]}
    ]
  },
  // NEW COUNTRIES
  {
    code: 'FR', name_az: 'Fransa', name_en: 'France', flag: '🇫🇷',
    source_url: 'https://solidarites-sante.gouv.fr', source_label: 'Ministère de la Santé',
    schedules: [
      { v: 'DTAP', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'IPV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'HIB', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'HEP_B', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'PCV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'MEN', schedules: [{ d: 1, age: 150, a_az: '5 aylıq', a_en: '5 months' }, { d: 2, age: 365, a_az: '12 aylıq', a_en: '12 months' }]},
      { v: 'MMR', schedules: [{ d: 1, age: 365, a_az: '12 aylıq', a_en: '12 months' }, { d: 2, age: 480, a_az: '16 aylıq', a_en: '16-18 months' }]}
    ]
  },
  {
    code: 'IT', name_az: 'İtaliya', name_en: 'Italy', flag: '🇮🇹',
    source_url: 'https://www.salute.gov.it', source_label: 'Ministero della Salute',
    schedules: [
      { v: 'DTAP', schedules: [{ d: 1, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 2, age: 150, a_az: '5 aylıq', a_en: '5 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'IPV', schedules: [{ d: 1, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 2, age: 150, a_az: '5 aylıq', a_en: '5 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'HEP_B', schedules: [{ d: 1, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 2, age: 150, a_az: '5 aylıq', a_en: '5 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'HIB', schedules: [{ d: 1, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 2, age: 150, a_az: '5 aylıq', a_en: '5 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'PCV', schedules: [{ d: 1, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 2, age: 150, a_az: '5 aylıq', a_en: '5 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'RV', schedules: [{ d: 1, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 2, age: 150, a_az: '5 aylıq', a_en: '5 months' }]},
      { v: 'MMR', schedules: [{ d: 1, age: 395, a_az: '13 aylıq', a_en: '13-15 months' }, { d: 2, age: 1825, a_az: '5-6 yaş', a_en: '5-6 years' }]},
      { v: 'VARICELLA', schedules: [{ d: 1, age: 395, a_az: '13 aylıq', a_en: '13-15 months' }, { d: 2, age: 1825, a_az: '5-6 yaş', a_en: '5-6 years' }]}
    ]
  },
  {
    code: 'ES', name_az: 'İspaniya', name_en: 'Spain', flag: '🇪🇸',
    source_url: 'https://www.sanidad.gob.es', source_label: 'Ministerio de Sanidad',
    schedules: [
      { v: 'DTAP', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'IPV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'HIB', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'HEP_B', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'PCV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 330, a_az: '11 aylıq', a_en: '11 months' }]},
      { v: 'MEN', schedules: [{ d: 1, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 2, age: 365, a_az: '12 aylıq', a_en: '12 months' }]},
      { v: 'MMR', schedules: [{ d: 1, age: 365, a_az: '12 aylıq', a_en: '12 months' }, { d: 2, age: 1095, a_az: '3-4 yaş', a_en: '3-4 years' }]},
      { v: 'VARICELLA', schedules: [{ d: 1, age: 450, a_az: '15 aylıq', a_en: '15 months' }, { d: 2, age: 1095, a_az: '3-4 yaş', a_en: '3-4 years' }]}
    ]
  },
  {
    code: 'CA', name_az: 'Kanada', name_en: 'Canada', flag: '🇨🇦',
    source_url: 'https://www.canada.ca/en/public-health.html', source_label: 'Public Health Canada',
    schedules: [
      { v: 'DTAP', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'IPV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'HIB', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'PCV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 365, a_az: '12 aylıq', a_en: '12 months' }]},
      { v: 'RV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }]},
      { v: 'MMR', schedules: [{ d: 1, age: 365, a_az: '12 aylıq', a_en: '12 months' }, { d: 2, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'MEN', schedules: [{ d: 1, age: 365, a_az: '12 aylıq', a_en: '12 months' }]}
    ]
  },
  {
    code: 'AU', name_az: 'Avstraliya', name_en: 'Australia', flag: '🇦🇺',
    source_url: 'https://www.health.gov.au/', source_label: 'Dept of Health AU',
    schedules: [
      { v: 'HEP_B', schedules: [{ d: 1, age: 0, a_az: 'Doğulanda', a_en: 'At birth' }, { d: 2, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 3, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 4, age: 180, a_az: '6 aylıq', a_en: '6 months' }]},
      { v: 'DTAP', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'IPV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }]},
      { v: 'HIB', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'PCV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 365, a_az: '12 aylıq', a_en: '12 months' }]},
      { v: 'RV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }]},
      { v: 'MMR', schedules: [{ d: 1, age: 365, a_az: '12 aylıq', a_en: '12 months' }, { d: 2, age: 540, a_az: '18 aylıq', a_en: '18 months' }]}
    ]
  },
  {
    code: 'AE', name_az: 'Birləşmiş Ərəb Əmirlikləri', name_en: 'United Arab Emirates', flag: '🇦🇪',
    source_url: 'https://www.mohap.gov.ae/', source_label: 'MOHAP UAE',
    schedules: [
      { v: 'BCG', schedules: [{ d: 1, age: 0, a_az: 'Doğulanda', a_en: 'At birth' }]},
      { v: 'HEP_B', schedules: [{ d: 1, age: 0, a_az: 'Doğulanda', a_en: 'At birth' }, { d: 2, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 3, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 4, age: 180, a_az: '6 aylıq', a_en: '6 months' }]},
      { v: 'DTAP', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'HIB', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'IPV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }]},
      { v: 'PCV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }]},
      { v: 'MMR', schedules: [{ d: 1, age: 365, a_az: '12 aylıq', a_en: '12 months' }, { d: 2, age: 1825, a_az: '5-6 yaş', a_en: '5-6 years' }]},
      { v: 'VARICELLA', schedules: [{ d: 1, age: 365, a_az: '12 aylıq', a_en: '12 months' }, { d: 2, age: 1825, a_az: '5-6 yaş', a_en: '5-6 years' }]}
    ]
  },
  {
    code: 'SA', name_az: 'Səudiyyə Ərəbistanı', name_en: 'Saudi Arabia', flag: '🇸🇦',
    source_url: 'https://www.moh.gov.sa/', source_label: 'MOH SA',
    schedules: [
      { v: 'BCG', schedules: [{ d: 1, age: 0, a_az: 'Doğulanda', a_en: 'At birth' }]},
      { v: 'HEP_B', schedules: [{ d: 1, age: 0, a_az: 'Doğulanda', a_en: 'At birth' }, { d: 2, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 3, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 4, age: 180, a_az: '6 aylıq', a_en: '6 months' }]},
      { v: 'DTAP', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }]},
      { v: 'PCV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }]},
      { v: 'RV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }]},
      { v: 'MEN', schedules: [{ d: 1, age: 270, a_az: '9 aylıq', a_en: '9 months' }, { d: 2, age: 365, a_az: '12 aylıq', a_en: '12 months' }]},
      { v: 'MMR', schedules: [{ d: 1, age: 365, a_az: '12 aylıq', a_en: '12 months' }, { d: 2, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'HEPA', schedules: [{ d: 1, age: 540, a_az: '18 aylıq', a_en: '18 months' }, { d: 2, age: 730, a_az: '24 aylıq', a_en: '24 months' }]}
    ]
  },
  {
    code: 'KZ', name_az: 'Qazaxıstan', name_en: 'Kazakhstan', flag: '🇰🇿',
    source_url: 'https://egov.kz/', source_label: 'eGov KZ',
    schedules: [
      { v: 'BCG', schedules: [{ d: 1, age: 3, a_az: '1-4 gün', a_en: '1-4 days' }]},
      { v: 'HEP_B', schedules: [{ d: 1, age: 3, a_az: '1-4 gün', a_en: '1-4 days' }, { d: 2, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 3, age: 120, a_az: '4 aylıq', a_en: '4 months' }]},
      { v: 'DTAP', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 3, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'IPV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 3, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'HIB', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 3, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'PCV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 365, a_az: '12 aylıq', a_en: '12 months' }]},
      { v: 'MMR', schedules: [{ d: 1, age: 365, a_az: '12 aylıq', a_en: '12 months' }, { d: 2, age: 2190, a_az: '6 yaş', a_en: '6 years' }]}
    ]
  },
  {
    code: 'GE', name_az: 'Gürcüstan', name_en: 'Georgia', flag: '🇬🇪',
    source_url: 'https://ncdc.ge/', source_label: 'NCDC Georgia',
    schedules: [
      { v: 'HEP_B', schedules: [{ d: 1, age: 0, a_az: 'Doğulanda', a_en: 'At birth' }]},
      { v: 'BCG', schedules: [{ d: 1, age: 3, a_az: '0-5 gün', a_en: '0-5 days' }]},
      { v: 'DTAP', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 3, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'IPV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 3, age: 120, a_az: '4 aylıq', a_en: '4 months' }]},
      { v: 'HIB', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 3, age: 120, a_az: '4 aylıq', a_en: '4 months' }]},
      { v: 'PCV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 3, age: 365, a_az: '12 aylıq', a_en: '12 months' }]},
      { v: 'RV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 90, a_az: '3 aylıq', a_en: '3 months' }]},
      { v: 'MMR', schedules: [{ d: 1, age: 365, a_az: '12 aylıq', a_en: '12 months' }, { d: 2, age: 1825, a_az: '5 yaş', a_en: '5 years' }]}
    ]
  },
  {
    code: 'UA', name_az: 'Ukrayna', name_en: 'Ukraine', flag: '🇺🇦',
    source_url: 'https://moz.gov.ua/', source_label: 'МОЗ України',
    schedules: [
      { v: 'HEP_B', schedules: [{ d: 1, age: 0, a_az: 'Doğulanda', a_en: 'At birth' }, { d: 2, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }]},
      { v: 'BCG', schedules: [{ d: 1, age: 4, a_az: '3-5 gün', a_en: '3-5 days' }]},
      { v: 'DTAP', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'IPV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 180, a_az: '6 aylıq', a_en: '6 months' }, { d: 4, age: 540, a_az: '18 aylıq', a_en: '18 months' }]},
      { v: 'HIB', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 3, age: 365, a_az: '12 aylıq', a_en: '12 months' }]},
      { v: 'MMR', schedules: [{ d: 1, age: 365, a_az: '12 aylıq', a_en: '12 months' }, { d: 2, age: 2190, a_az: '6 yaş', a_en: '6 years' }]}
    ]
  },
  {
    code: 'UZ', name_az: 'Özbəkistan', name_en: 'Uzbekistan', flag: '🇺🇿',
    source_url: 'https://ssv.uz/', source_label: 'Sog‘liqni Saqlash Vazirligi',
    schedules: [
      { v: 'HEP_B', schedules: [{ d: 1, age: 0, a_az: 'Doğulanda', a_en: 'At birth' }, { d: 2, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 3, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 4, age: 120, a_az: '4 aylıq', a_en: '4 months' }]},
      { v: 'BCG', schedules: [{ d: 1, age: 3, a_az: '2-5 gün', a_en: '2-5 days' }]},
      { v: 'DTAP', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 3, age: 120, a_az: '4 aylıq', a_en: '4 months' }, { d: 4, age: 480, a_az: '16 aylıq', a_en: '16 months' }]},
      { v: 'IPV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 3, age: 120, a_az: '4 aylıq', a_en: '4 months' }]},
      { v: 'HIB', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 3, age: 120, a_az: '4 aylıq', a_en: '4 months' }]},
      { v: 'RV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 90, a_az: '3 aylıq', a_en: '3 months' }]},
      { v: 'PCV', schedules: [{ d: 1, age: 60, a_az: '2 aylıq', a_en: '2 months' }, { d: 2, age: 90, a_az: '3 aylıq', a_en: '3 months' }, { d: 3, age: 365, a_az: '12 aylıq', a_en: '12 months' }]},
      { v: 'MMR', schedules: [{ d: 1, age: 365, a_az: '12 aylıq', a_en: '12 months' }, { d: 2, age: 2190, a_az: '6 yaş', a_en: '6 years' }]}
    ]
  }
];

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
}

const sqlStmts = [];
sqlStmts.push(`-- 20260629000000_seed_major_vaccine_countries.sql
-- Seed script for major countries vaccine schedules (TR, US, GB, DE, RU, FR, IT, ES, CA, AU, AE, SA, KZ, GE, UA, UZ)

BEGIN;
`);

const codes = COUNTRIES.map(c => `'${c.code}'`).join(', ');
sqlStmts.push(`DELETE FROM public.vaccine_countries WHERE code IN (${codes});`);
sqlStmts.push(``);

let sort_order_c = 10;
for (const c of COUNTRIES) {
  const countryId = crypto.randomUUID();
  sqlStmts.push(`INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('${countryId}', '${c.code}', ${escapeSql(c.name_az)}, ${escapeSql(c.name_en)}, '${c.flag}', ${escapeSql(c.source_url)}, ${escapeSql(c.source_label)}, ${sort_order_c++});`);

  let sort_order_v = 10;
  for (const sv of c.schedules) {
    const v = VACCINES[sv.v];
    const vacId = crypto.randomUUID();
    sqlStmts.push(`INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('${vacId}', '${c.code}', '${v.code}', ${escapeSql(v.name_az)}, ${escapeSql(v.name_en)}, ${escapeSql(v.disease_az)}, ${escapeSql(v.disease_en)}, ${escapeSql(v.route_az)}, ${escapeSql(v.route_en)}, '${v.color_hex}', true, ${sort_order_v++});`);

    let sort_order_s = 10;
    for (const sch of sv.schedules) {
      const schId = crypto.randomUUID();
      const dose_az = sch.d + '-ci doza';
      const dose_en = sch.d + (sch.d === 1 ? 'st' : sch.d === 2 ? 'nd' : sch.d === 3 ? 'rd' : 'th') + ' dose';
      sqlStmts.push(`INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('${schId}', '${vacId}', '${c.code}', ${sch.d}, ${escapeSql(dose_az)}, ${escapeSql(dose_en)}, ${sch.age}, ${escapeSql(sch.a_az)}, ${escapeSql(sch.a_en)}, ${sort_order_s++});`);
    }
  }
}

sqlStmts.push(`COMMIT;`);

fs.writeFileSync('supabase/migrations/20260629000000_seed_major_vaccine_countries.sql', sqlStmts.join('\n'));
console.log('Migration generated successfully with ' + COUNTRIES.length + ' countries.');
