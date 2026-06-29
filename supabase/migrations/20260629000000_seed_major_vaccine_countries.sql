-- 20260629000000_seed_major_vaccine_countries.sql
-- Seed script for major countries vaccine schedules (TR, US, GB, DE, RU, FR, IT, ES, CA, AU, AE, SA, KZ, GE, UA, UZ)

BEGIN;

DELETE FROM public.vaccine_countries WHERE code IN ('TR', 'US', 'GB', 'DE', 'RU', 'FR', 'IT', 'ES', 'CA', 'AU', 'AE', 'SA', 'KZ', 'GE', 'UA', 'UZ');

INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('1ff27825-c4d3-4bbf-97c4-8d7dd4be856d', 'TR', 'Türkiyə', 'Turkey', '🇹🇷', 'https://saglik.gov.tr', 'T.C. Sağlık Bakanlığı', 10);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('4ffb26d1-b9c0-4cee-9ee8-3a80d934cee2', 'TR', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('19e9e591-df8b-46ea-aaf9-4e9eaed1b2e6', '4ffb26d1-b9c0-4cee-9ee8-3a80d934cee2', 'TR', 1, '1-ci doza', '1st dose', 0, 'Doğulanda', 'At birth', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a0bb7a99-1a6a-4323-ab1d-de44e4f4b962', '4ffb26d1-b9c0-4cee-9ee8-3a80d934cee2', 'TR', 2, '2-ci doza', '2nd dose', 30, '1 aylıq', '1 month', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b9a3656f-8476-492a-afce-7393e75c2cb0', '4ffb26d1-b9c0-4cee-9ee8-3a80d934cee2', 'TR', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('4798fbd9-0194-4edf-8988-1915803549f9', 'TR', 'BCG', 'Vərəm (BCG)', 'Tuberculosis (BCG)', 'Vərəm', 'Tuberculosis', 'Dəridaxili', 'Intradermal', '#10B981', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('107a94e4-b890-4407-9335-151b96b1ecb1', '4798fbd9-0194-4edf-8988-1915803549f9', 'TR', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('83b37633-ef49-4aef-bb12-ca0e9ee0a7ac', 'TR', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c6d1ddd6-686b-4b46-8e6d-ae1921824217', '83b37633-ef49-4aef-bb12-ca0e9ee0a7ac', 'TR', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('f5f6e6ba-ec39-4342-acfd-28b4600fd70b', '83b37633-ef49-4aef-bb12-ca0e9ee0a7ac', 'TR', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('4553711d-b2df-477d-8bb0-a229f1f3ed0e', '83b37633-ef49-4aef-bb12-ca0e9ee0a7ac', 'TR', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('8a066c77-75d3-48ac-b387-a78f1a107877', '83b37633-ef49-4aef-bb12-ca0e9ee0a7ac', 'TR', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('fa8c82d9-1e03-414d-a619-b7374a375689', 'TR', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('604fd1f6-6279-42c7-942c-dc2d1c21d008', 'fa8c82d9-1e03-414d-a619-b7374a375689', 'TR', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a851d232-0b7f-408b-abe2-6c4bb23646fa', 'fa8c82d9-1e03-414d-a619-b7374a375689', 'TR', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a7fd4af9-9aec-437c-9ffb-a3e3fa0cff28', 'fa8c82d9-1e03-414d-a619-b7374a375689', 'TR', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('db7e916a-5339-47c7-92f6-90dfc51a31f0', 'fa8c82d9-1e03-414d-a619-b7374a375689', 'TR', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('8e86d657-6749-40d6-add8-9fa113479d3f', 'TR', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3e4d04f7-676f-4e14-bad7-36afcbf26033', '8e86d657-6749-40d6-add8-9fa113479d3f', 'TR', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('ce39ddfd-5a0d-4833-b0c8-6ac26c4a7263', '8e86d657-6749-40d6-add8-9fa113479d3f', 'TR', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e2f9342c-9cdc-4c85-9ac4-af86c74da2bd', '8e86d657-6749-40d6-add8-9fa113479d3f', 'TR', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c39cdde5-d257-4fee-9f66-a236f3d8267e', '8e86d657-6749-40d6-add8-9fa113479d3f', 'TR', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('6a471bf1-57ec-4db9-be82-ff554a808092', 'TR', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c4a7747d-3123-4465-9a24-c3f92cad05f8', '6a471bf1-57ec-4db9-be82-ff554a808092', 'TR', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('0572f6e3-b258-4f28-acc5-eb38c601e455', '6a471bf1-57ec-4db9-be82-ff554a808092', 'TR', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e9973e97-8332-44de-9454-c20e246b569d', '6a471bf1-57ec-4db9-be82-ff554a808092', 'TR', 3, '3-ci doza', '3rd dose', 365, '12 aylıq', '12 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('13b94be3-4450-407f-80e0-152fcd3bfdea', 'TR', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('f266fa3c-4fb2-41c7-b47f-f5ec52cf423a', '13b94be3-4450-407f-80e0-152fcd3bfdea', 'TR', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('83d93208-41cd-4a9c-85cf-c4cc7cd4965f', '13b94be3-4450-407f-80e0-152fcd3bfdea', 'TR', 2, '2-ci doza', '2nd dose', 1460, '48 aylıq', '48 months', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('ab1e94dd-d33a-4dbc-9d61-94cf0ce3f310', 'TR', 'VAR', 'Su çiçəyi', 'Varicella (Chickenpox)', 'Su çiçəyi', 'Chickenpox', 'Dərialtı', 'Subcutaneous', '#6366F1', true, 17);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('585dded5-236f-4866-a212-892b7d64edd5', 'ab1e94dd-d33a-4dbc-9d61-94cf0ce3f310', 'TR', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('b1b02749-bf75-41c2-b0d4-05d8f92e640d', 'TR', 'HepA', 'Hepatit A', 'Hepatitis A', 'Hepatit A virusu', 'Hepatitis A virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 18);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('29775eb0-3466-4bb2-8c01-ac3c4aa89852', 'b1b02749-bf75-41c2-b0d4-05d8f92e640d', 'TR', 1, '1-ci doza', '1st dose', 540, '18 aylıq', '18 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e646a75e-6d19-471f-b9f7-62418eab5d63', 'b1b02749-bf75-41c2-b0d4-05d8f92e640d', 'TR', 2, '2-ci doza', '2nd dose', 730, '24 aylıq', '24 months', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('6956d2e2-677b-499b-a2ae-679bd7997a07', 'US', 'ABŞ', 'USA', '🇺🇸', 'https://www.cdc.gov/vaccines/schedules/', 'CDC', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('6100cfee-4f7d-4911-8b54-c9a4987f0099', 'US', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('7b99e146-6b1d-4bd0-8134-1b1d9ae4ef9f', '6100cfee-4f7d-4911-8b54-c9a4987f0099', 'US', 1, '1-ci doza', '1st dose', 0, 'Doğulanda', 'At birth', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('33b3f401-2674-44e9-83d3-7f36ecbc215b', '6100cfee-4f7d-4911-8b54-c9a4987f0099', 'US', 2, '2-ci doza', '2nd dose', 60, '2 aylıq', '2 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('2e673129-7254-4f23-92a4-bc92f99733cd', '6100cfee-4f7d-4911-8b54-c9a4987f0099', 'US', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('09f5f72d-1230-4003-8658-52ec14569dc6', 'US', 'RV', 'Rotavirus', 'Rotavirus', 'Rotavirus ishalı', 'Rotavirus diarrhea', 'Ağızdan', 'Oral', '#14B8A6', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('422f0690-8d25-4c0a-a13d-339dfde4f829', '09f5f72d-1230-4003-8658-52ec14569dc6', 'US', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('7fad6c0d-b9a5-49e2-bfe9-a0a4677caa30', '09f5f72d-1230-4003-8658-52ec14569dc6', 'US', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c7dde6e0-4227-4426-ab1f-75262630849f', '09f5f72d-1230-4003-8658-52ec14569dc6', 'US', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('da48d193-4299-4ef0-b22d-80ee9ae29a93', 'US', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('d8acc50a-bb02-4e5a-8536-d78a88dc9c4a', 'da48d193-4299-4ef0-b22d-80ee9ae29a93', 'US', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('4005577d-16ea-4a20-95b2-7c2222c5f804', 'da48d193-4299-4ef0-b22d-80ee9ae29a93', 'US', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('33f23a72-af7e-4dad-8611-24b38cf6ffb9', 'da48d193-4299-4ef0-b22d-80ee9ae29a93', 'US', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('423dcfcc-f2cf-4d40-a385-45cd538e3403', 'da48d193-4299-4ef0-b22d-80ee9ae29a93', 'US', 4, '4-ci doza', '4th dose', 450, '15 aylıq', '15 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('d103a77d-993d-4306-9e45-4be5af17f45e', 'US', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('1ecbf703-b44f-4552-80e8-3857c463aced', 'd103a77d-993d-4306-9e45-4be5af17f45e', 'US', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c4a51d2f-8e2e-40d3-b975-75bb701599ce', 'd103a77d-993d-4306-9e45-4be5af17f45e', 'US', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c61a8eb5-3f67-4a9b-bf80-617f95b6dc59', 'd103a77d-993d-4306-9e45-4be5af17f45e', 'US', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('816b771a-671a-4275-afae-5b723b4cf3a1', 'd103a77d-993d-4306-9e45-4be5af17f45e', 'US', 4, '4-ci doza', '4th dose', 365, '12 aylıq', '12 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('6301c98a-dee1-4121-adf1-0ea5b1cffd30', 'US', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e97b9847-65cf-478c-967a-e657001c9d4d', '6301c98a-dee1-4121-adf1-0ea5b1cffd30', 'US', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('d3aadc06-e548-4596-ad0e-9ac8911a6c56', '6301c98a-dee1-4121-adf1-0ea5b1cffd30', 'US', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('8ac810f1-5421-4fec-acd3-8674ca3d49f9', '6301c98a-dee1-4121-adf1-0ea5b1cffd30', 'US', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('5e0cbf10-525a-4dac-995d-f6c32850dbe6', '6301c98a-dee1-4121-adf1-0ea5b1cffd30', 'US', 4, '4-ci doza', '4th dose', 365, '12 aylıq', '12 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('18fcb855-44b2-44ae-ac65-1c157c02844a', 'US', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('f5755d97-95dd-48bd-9597-c48a659e87b3', '18fcb855-44b2-44ae-ac65-1c157c02844a', 'US', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('41004965-65ca-4766-b116-53954daf5aa2', '18fcb855-44b2-44ae-ac65-1c157c02844a', 'US', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('fd31e746-a274-468b-bcd5-b828eb820d1e', '18fcb855-44b2-44ae-ac65-1c157c02844a', 'US', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('6cde11a5-c3da-43eb-8ab6-29c79dbea802', 'US', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b28ac7fb-a825-4144-95dc-d9590cb57d01', '6cde11a5-c3da-43eb-8ab6-29c79dbea802', 'US', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('0c1e56d4-2ef5-48e7-ae0d-51d4f69c9b69', '6cde11a5-c3da-43eb-8ab6-29c79dbea802', 'US', 2, '2-ci doza', '2nd dose', 1460, '4-6 yaş', '4-6 years', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('2bc828f3-8638-47f2-a4c7-d8ca5c7c5129', 'US', 'VAR', 'Su çiçəyi', 'Varicella (Chickenpox)', 'Su çiçəyi', 'Chickenpox', 'Dərialtı', 'Subcutaneous', '#6366F1', true, 17);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('19bed4a6-2af6-4767-9199-6fc61cd54e6e', '2bc828f3-8638-47f2-a4c7-d8ca5c7c5129', 'US', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('5375fd09-e181-4726-8a4b-3a248b9caf20', '2bc828f3-8638-47f2-a4c7-d8ca5c7c5129', 'US', 2, '2-ci doza', '2nd dose', 1460, '4-6 yaş', '4-6 years', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('f1cd7a7f-097c-43ba-9c5c-f83fada5ceb9', 'GB', 'Böyük Britaniya', 'United Kingdom', '🇬🇧', 'https://www.nhs.uk/conditions/vaccinations/', 'NHS', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('a7eca66d-6996-4a4f-8144-11fcf292731f', 'GB', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('bd3fa657-75a7-468d-84ff-a26ac13df05d', 'a7eca66d-6996-4a4f-8144-11fcf292731f', 'GB', 1, '1-ci doza', '1st dose', 60, '8 həftə', '8 weeks', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b4a415d1-cffd-45b6-b062-05c96ba2aef8', 'a7eca66d-6996-4a4f-8144-11fcf292731f', 'GB', 2, '2-ci doza', '2nd dose', 90, '12 həftə', '12 weeks', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b572f075-01f8-495d-a7ac-f05d108f315d', 'a7eca66d-6996-4a4f-8144-11fcf292731f', 'GB', 3, '3-ci doza', '3rd dose', 120, '16 həftə', '16 weeks', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('882d2ef7-364e-43f8-abbf-49a885f1f1f4', 'a7eca66d-6996-4a4f-8144-11fcf292731f', 'GB', 4, '4-ci doza', '4th dose', 1095, '3 yaş 4 ay', '3y 4m', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('aa88a8aa-6e0d-4a62-aeb1-2c762634f3ca', 'GB', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e9356936-7766-4ad7-9f5b-e21f996e829d', 'aa88a8aa-6e0d-4a62-aeb1-2c762634f3ca', 'GB', 1, '1-ci doza', '1st dose', 60, '8 həftə', '8 weeks', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('de985693-e6cd-4bd3-8346-a892a101d0ca', 'aa88a8aa-6e0d-4a62-aeb1-2c762634f3ca', 'GB', 2, '2-ci doza', '2nd dose', 90, '12 həftə', '12 weeks', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3c9bab0a-74a5-437a-8436-d246e99e2b02', 'aa88a8aa-6e0d-4a62-aeb1-2c762634f3ca', 'GB', 3, '3-ci doza', '3rd dose', 120, '16 həftə', '16 weeks', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('0d87554d-2be7-4abd-ac17-7d197d0922f3', 'aa88a8aa-6e0d-4a62-aeb1-2c762634f3ca', 'GB', 4, '4-ci doza', '4th dose', 1095, '3 yaş 4 ay', '3y 4m', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('7ea6a9d7-4b2e-47ea-b9bc-b9f2fc31a687', 'GB', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a6b2a53b-c065-4368-9344-0de14492bd5a', '7ea6a9d7-4b2e-47ea-b9bc-b9f2fc31a687', 'GB', 1, '1-ci doza', '1st dose', 60, '8 həftə', '8 weeks', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('6b4b6cb2-e852-4ea8-aa7e-9895eed45471', '7ea6a9d7-4b2e-47ea-b9bc-b9f2fc31a687', 'GB', 2, '2-ci doza', '2nd dose', 90, '12 həftə', '12 weeks', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('f9b80997-a4f0-472d-9171-7f3a4a4ed466', '7ea6a9d7-4b2e-47ea-b9bc-b9f2fc31a687', 'GB', 3, '3-ci doza', '3rd dose', 120, '16 həftə', '16 weeks', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('494a66ff-f79a-484d-8b4d-27d79af9d9ed', '7ea6a9d7-4b2e-47ea-b9bc-b9f2fc31a687', 'GB', 4, '4-ci doza', '4th dose', 365, '1 yaş', '1 year', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('40dd5fef-7836-4619-982a-82cd4cbcb4ab', 'GB', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('72692889-316c-4cba-858a-d54638f0e03f', '40dd5fef-7836-4619-982a-82cd4cbcb4ab', 'GB', 1, '1-ci doza', '1st dose', 60, '8 həftə', '8 weeks', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c754b13d-f75f-4da3-aa09-1a80ef43299f', '40dd5fef-7836-4619-982a-82cd4cbcb4ab', 'GB', 2, '2-ci doza', '2nd dose', 90, '12 həftə', '12 weeks', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('4bd6a0ba-9a86-4376-8ea1-78a4966af123', '40dd5fef-7836-4619-982a-82cd4cbcb4ab', 'GB', 3, '3-ci doza', '3rd dose', 120, '16 həftə', '16 weeks', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('02900845-5a9d-4f8d-9a71-58fdafb237a8', 'GB', 'RV', 'Rotavirus', 'Rotavirus', 'Rotavirus ishalı', 'Rotavirus diarrhea', 'Ağızdan', 'Oral', '#14B8A6', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('305e6233-5519-4aec-90f5-1152b6a5ca84', '02900845-5a9d-4f8d-9a71-58fdafb237a8', 'GB', 1, '1-ci doza', '1st dose', 60, '8 həftə', '8 weeks', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('df37cdf7-4d84-4280-94df-55006455a682', '02900845-5a9d-4f8d-9a71-58fdafb237a8', 'GB', 2, '2-ci doza', '2nd dose', 90, '12 həftə', '12 weeks', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('ca8e983e-6718-4ef4-b93d-edab08af91c3', 'GB', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('f95778d8-0f2c-426a-9a96-14550cee5623', 'ca8e983e-6718-4ef4-b93d-edab08af91c3', 'GB', 1, '1-ci doza', '1st dose', 90, '12 həftə', '12 weeks', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3a6ecdf3-11c6-44e5-a9ce-72422ceed4a9', 'ca8e983e-6718-4ef4-b93d-edab08af91c3', 'GB', 2, '2-ci doza', '2nd dose', 365, '1 yaş', '1 year', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('afdb7398-286a-4177-97e6-969d1dcf7468', 'GB', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('74261d46-c899-45eb-a295-11a512f34526', 'afdb7398-286a-4177-97e6-969d1dcf7468', 'GB', 1, '1-ci doza', '1st dose', 365, '1 yaş', '1 year', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('88c9f423-1d78-4b34-9422-c58fed5863f7', 'afdb7398-286a-4177-97e6-969d1dcf7468', 'GB', 2, '2-ci doza', '2nd dose', 1095, '3 yaş 4 ay', '3y 4m', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('b710e472-a857-4124-8f9c-2a8717dd6c10', 'DE', 'Almaniya', 'Germany', '🇩🇪', 'https://www.rki.de/', 'STIKO (RKI)', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('a53c2b9e-2e43-4162-9c5f-ebbb59476d34', 'DE', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3a895e56-976b-484e-a117-7840ce026cec', 'a53c2b9e-2e43-4162-9c5f-ebbb59476d34', 'DE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('d61760a7-6468-4369-aa51-b853c9ad7154', 'a53c2b9e-2e43-4162-9c5f-ebbb59476d34', 'DE', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('8103e1fa-dcb0-43f5-9694-e770c65f22ee', 'a53c2b9e-2e43-4162-9c5f-ebbb59476d34', 'DE', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('e78645dc-9a12-427e-a467-152595e0a443', 'DE', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('645bdfbf-9ad9-4ef3-9cf5-b74b468c714a', 'e78645dc-9a12-427e-a467-152595e0a443', 'DE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('47736aaf-b8fc-4dcd-af88-4960188b3bae', 'e78645dc-9a12-427e-a467-152595e0a443', 'DE', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('884b3f1e-e6b7-460d-a40f-eac4ab906141', 'e78645dc-9a12-427e-a467-152595e0a443', 'DE', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('a2fd298d-1246-4b7f-92e6-07997b51eb5c', 'DE', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('779c0861-8408-45d7-b797-03df7c9285f2', 'a2fd298d-1246-4b7f-92e6-07997b51eb5c', 'DE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e0528169-c5b9-4176-b12c-589f96429353', 'a2fd298d-1246-4b7f-92e6-07997b51eb5c', 'DE', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('1574521c-b516-46cd-9bbe-89d5e52ec55f', 'a2fd298d-1246-4b7f-92e6-07997b51eb5c', 'DE', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('eedcd393-249e-46e3-ba1c-7a3b899ef57c', 'DE', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('48ae085d-de52-497a-9fac-63cedebc6cce', 'eedcd393-249e-46e3-ba1c-7a3b899ef57c', 'DE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('5bb48615-c67c-421a-a416-8e81035340df', 'eedcd393-249e-46e3-ba1c-7a3b899ef57c', 'DE', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('bec0c16a-69f8-4fd5-9564-6c08f7c3cb97', 'eedcd393-249e-46e3-ba1c-7a3b899ef57c', 'DE', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('0499c6ef-df07-4392-adf9-667a2a2e77f4', 'DE', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('d57f3869-9a97-4035-8e7a-7dd026a0c791', '0499c6ef-df07-4392-adf9-667a2a2e77f4', 'DE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('5cd5d568-515b-4f0b-a974-099bf32c504c', '0499c6ef-df07-4392-adf9-667a2a2e77f4', 'DE', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('9eff9cd6-ec6b-4c53-b333-4d51ac5d81bf', '0499c6ef-df07-4392-adf9-667a2a2e77f4', 'DE', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('39a4f578-7a34-4f19-aefd-a9a8c4706101', 'DE', 'RV', 'Rotavirus', 'Rotavirus', 'Rotavirus ishalı', 'Rotavirus diarrhea', 'Ağızdan', 'Oral', '#14B8A6', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b23ecd9d-8592-400c-97e5-78ace4c687ef', '39a4f578-7a34-4f19-aefd-a9a8c4706101', 'DE', 1, '1-ci doza', '1st dose', 42, '6 həftə', '6 weeks', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('ebb9b094-91a0-484d-8a22-33d43a6fbfcc', '39a4f578-7a34-4f19-aefd-a9a8c4706101', 'DE', 2, '2-ci doza', '2nd dose', 60, '2 aylıq', '2 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a2370f2e-aab0-4b0a-983e-512bd541f2a9', '39a4f578-7a34-4f19-aefd-a9a8c4706101', 'DE', 3, '3-ci doza', '3rd dose', 120, '4 aylıq', '4 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('14158ed4-c4ca-4d6f-9f8b-c07127eb4769', 'DE', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3156c7fc-c5fb-4dc7-8082-6bac4916c616', '14158ed4-c4ca-4d6f-9f8b-c07127eb4769', 'DE', 1, '1-ci doza', '1st dose', 330, '11 aylıq', '11 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('4ba52679-4d3f-414f-bf27-1064c8ff7f72', '14158ed4-c4ca-4d6f-9f8b-c07127eb4769', 'DE', 2, '2-ci doza', '2nd dose', 450, '15 aylıq', '15 months', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('fce6a756-3f35-4b18-85b5-05d8c8c70a46', 'DE', 'VAR', 'Su çiçəyi', 'Varicella (Chickenpox)', 'Su çiçəyi', 'Chickenpox', 'Dərialtı', 'Subcutaneous', '#6366F1', true, 17);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('33b13d68-8ff6-47d8-8194-b1b9af2f0da3', 'fce6a756-3f35-4b18-85b5-05d8c8c70a46', 'DE', 1, '1-ci doza', '1st dose', 330, '11 aylıq', '11 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3581f2fa-7db5-486d-9d3e-094d3920fdd9', 'fce6a756-3f35-4b18-85b5-05d8c8c70a46', 'DE', 2, '2-ci doza', '2nd dose', 450, '15 aylıq', '15 months', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('1104f43d-e4e9-4148-a553-c03df6c30468', 'RU', 'Rusiya', 'Russia', '🇷🇺', 'https://minzdrav.gov.ru/', 'Минздрав РФ', 14);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('b746449b-b203-48a3-a721-f4d24831f6b8', 'RU', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('05eb6f1e-6ebf-4368-85d1-9166738375b8', 'b746449b-b203-48a3-a721-f4d24831f6b8', 'RU', 1, '1-ci doza', '1st dose', 0, 'Doğulanda', 'At birth', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('12b7c3d4-1480-4efc-90ec-11535ff64e14', 'b746449b-b203-48a3-a721-f4d24831f6b8', 'RU', 2, '2-ci doza', '2nd dose', 30, '1 aylıq', '1 month', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('75c27cc7-e84c-4092-82fe-93566a551254', 'b746449b-b203-48a3-a721-f4d24831f6b8', 'RU', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('d57774a3-c066-4ea4-839c-03a8320d8e47', 'RU', 'BCG', 'Vərəm (BCG)', 'Tuberculosis (BCG)', 'Vərəm', 'Tuberculosis', 'Dəridaxili', 'Intradermal', '#10B981', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('2552642a-4e52-41ac-aea6-cb52a7a62d2f', 'd57774a3-c066-4ea4-839c-03a8320d8e47', 'RU', 1, '1-ci doza', '1st dose', 3, '3-7 gün', '3-7 days', 10);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('960ccf63-b572-4e95-9b2c-24f0e7977fb6', 'RU', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('cd2d1606-d135-4b89-a6c1-6616478f75bb', '960ccf63-b572-4e95-9b2c-24f0e7977fb6', 'RU', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3c09e14b-193d-4920-b34b-eefecdcdbd36', '960ccf63-b572-4e95-9b2c-24f0e7977fb6', 'RU', 2, '2-ci doza', '2nd dose', 135, '4.5 aylıq', '4.5 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('ab2b8c41-7637-43b3-b5d8-ac255a515655', '960ccf63-b572-4e95-9b2c-24f0e7977fb6', 'RU', 3, '3-ci doza', '3rd dose', 450, '15 aylıq', '15 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('c49a7a30-3fb7-4ce5-ae49-97926a798abd', 'RU', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a3193e62-56f2-464b-b841-9b32c9d59851', 'c49a7a30-3fb7-4ce5-ae49-97926a798abd', 'RU', 1, '1-ci doza', '1st dose', 90, '3 aylıq', '3 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('2069fd81-770d-49c0-b094-5a4c9c45eaf1', 'c49a7a30-3fb7-4ce5-ae49-97926a798abd', 'RU', 2, '2-ci doza', '2nd dose', 135, '4.5 aylıq', '4.5 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('36199d10-fb04-4d8d-b739-cbc5fb2e9dfd', 'c49a7a30-3fb7-4ce5-ae49-97926a798abd', 'RU', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c668e940-e2bd-42bc-996b-64d9d3991a93', 'c49a7a30-3fb7-4ce5-ae49-97926a798abd', 'RU', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('18e33f6c-3308-413e-b643-7ec6e7b6882c', 'RU', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('4ade9162-722c-49f1-8653-bba93a9ae7f7', '18e33f6c-3308-413e-b643-7ec6e7b6882c', 'RU', 1, '1-ci doza', '1st dose', 90, '3 aylıq', '3 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('dae81149-75f9-4fb4-9cfe-aa6a9d6cc529', '18e33f6c-3308-413e-b643-7ec6e7b6882c', 'RU', 2, '2-ci doza', '2nd dose', 135, '4.5 aylıq', '4.5 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('09af9f74-aedb-4d27-93d2-cfa1fe8a36a8', '18e33f6c-3308-413e-b643-7ec6e7b6882c', 'RU', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('3863db64-5cd2-4ff3-9a4d-df01af6f8b43', 'RU', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3ea75b7c-b04e-4ce8-a853-44dd63bb03d9', '3863db64-5cd2-4ff3-9a4d-df01af6f8b43', 'RU', 1, '1-ci doza', '1st dose', 90, '3 aylıq', '3 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('95070e40-6659-4441-b97e-860f06da3ff4', '3863db64-5cd2-4ff3-9a4d-df01af6f8b43', 'RU', 2, '2-ci doza', '2nd dose', 135, '4.5 aylıq', '4.5 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('0e324150-7d24-424e-88e2-fbe46dafa8a7', '3863db64-5cd2-4ff3-9a4d-df01af6f8b43', 'RU', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('d1e8a0a1-82a7-4010-a1f1-2d8253de0b3d', '3863db64-5cd2-4ff3-9a4d-df01af6f8b43', 'RU', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('f70e3127-a078-42a8-90aa-f02795257f61', 'RU', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('12b3c366-1b92-4d3d-a9ad-1df703ce638c', 'f70e3127-a078-42a8-90aa-f02795257f61', 'RU', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('00e365fc-6ffb-471e-8736-d01829f924c2', 'f70e3127-a078-42a8-90aa-f02795257f61', 'RU', 2, '2-ci doza', '2nd dose', 2190, '6 yaş', '6 years', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('98c8295d-5f43-4649-928a-1788fbf92cb5', 'FR', 'Fransa', 'France', '🇫🇷', 'https://solidarites-sante.gouv.fr', 'Ministère de la Santé', 15);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('0c059a27-6847-43d5-8bd6-cb2dec813bb8', 'FR', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b553e7ea-de73-4d22-b690-d82978313766', '0c059a27-6847-43d5-8bd6-cb2dec813bb8', 'FR', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('466292c1-6fcd-4a3c-a53d-1f64eed0bfd9', '0c059a27-6847-43d5-8bd6-cb2dec813bb8', 'FR', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b446d51b-4799-4c68-a9b1-2da0e40b69ab', '0c059a27-6847-43d5-8bd6-cb2dec813bb8', 'FR', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('39030251-6d46-4a02-a808-a5619b921b04', 'FR', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('09ecca61-d627-45c3-8f93-e021903f2eb3', '39030251-6d46-4a02-a808-a5619b921b04', 'FR', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('01361b59-6731-4dfc-8eb8-74c7278c355e', '39030251-6d46-4a02-a808-a5619b921b04', 'FR', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e66541df-a719-4d95-9474-22e9aeeeab08', '39030251-6d46-4a02-a808-a5619b921b04', 'FR', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('648f6778-4fa6-4b96-813a-197063b19bbe', 'FR', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('25486c1d-825b-4724-981b-291cc9d185de', '648f6778-4fa6-4b96-813a-197063b19bbe', 'FR', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('871b0187-d064-4c3e-9397-384560eda66d', '648f6778-4fa6-4b96-813a-197063b19bbe', 'FR', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('2211dc6f-2bac-4b7d-bdae-abab30a6424e', '648f6778-4fa6-4b96-813a-197063b19bbe', 'FR', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('4c64abb0-3705-4d04-b3a3-e74fc55bf7ad', 'FR', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('27725659-8b34-400b-ba16-4ef6684eb422', '4c64abb0-3705-4d04-b3a3-e74fc55bf7ad', 'FR', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('815cde8b-6e8a-4039-935c-dc0490f035a5', '4c64abb0-3705-4d04-b3a3-e74fc55bf7ad', 'FR', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('1d54bf0b-3b18-427b-9d60-a1b653c563da', '4c64abb0-3705-4d04-b3a3-e74fc55bf7ad', 'FR', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('74db879b-3be5-4e21-a661-07595b8cf545', 'FR', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('8ea6de96-24e3-43a7-82a4-aa0d6e52fbd9', '74db879b-3be5-4e21-a661-07595b8cf545', 'FR', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('fc54f7b1-9746-4211-9c22-b16698400b98', '74db879b-3be5-4e21-a661-07595b8cf545', 'FR', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('33492594-ff43-4f44-9ea5-a0b0baa64e16', '74db879b-3be5-4e21-a661-07595b8cf545', 'FR', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('9cec2c5e-7a1d-48db-accd-2aa10897e56d', 'FR', 'MenACWY', 'Meningokokk', 'Meningococcal', 'Meningokokk xəstəliyi', 'Meningococcal disease', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('00f9a655-d0c8-4689-9ea1-f6f175c6ab06', '9cec2c5e-7a1d-48db-accd-2aa10897e56d', 'FR', 1, '1-ci doza', '1st dose', 150, '5 aylıq', '5 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('dcd36605-12f8-4098-ba5b-c290bbe308db', '9cec2c5e-7a1d-48db-accd-2aa10897e56d', 'FR', 2, '2-ci doza', '2nd dose', 365, '12 aylıq', '12 months', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('7828588e-038b-4f8a-99cc-acbd9aff019d', 'FR', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('102bda60-fc9d-410c-90f1-09c3e8608c1a', '7828588e-038b-4f8a-99cc-acbd9aff019d', 'FR', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('68f50ed6-0661-49f6-9957-794e8b700f27', '7828588e-038b-4f8a-99cc-acbd9aff019d', 'FR', 2, '2-ci doza', '2nd dose', 480, '16 aylıq', '16-18 months', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('ee03583d-43c1-4735-bc96-1c3cf9054bca', 'IT', 'İtaliya', 'Italy', '🇮🇹', 'https://www.salute.gov.it', 'Ministero della Salute', 16);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('d7afd771-6416-448d-a8c0-7e3c8a5d1aab', 'IT', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('39a3cd3e-53aa-4d86-91a2-9f132da3dca4', 'd7afd771-6416-448d-a8c0-7e3c8a5d1aab', 'IT', 1, '1-ci doza', '1st dose', 90, '3 aylıq', '3 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('5504a5f0-284b-4c16-ae42-89f5f6584cd0', 'd7afd771-6416-448d-a8c0-7e3c8a5d1aab', 'IT', 2, '2-ci doza', '2nd dose', 150, '5 aylıq', '5 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('4becd0ef-6e77-42b8-a9bf-a3959654c6c2', 'd7afd771-6416-448d-a8c0-7e3c8a5d1aab', 'IT', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('54db363f-635d-4f05-b6a3-525a2dbb5153', 'IT', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3cf50b74-60a6-4584-9362-bf8a33775611', '54db363f-635d-4f05-b6a3-525a2dbb5153', 'IT', 1, '1-ci doza', '1st dose', 90, '3 aylıq', '3 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('03265d93-7e4b-49b0-bc5d-a8d989a0b655', '54db363f-635d-4f05-b6a3-525a2dbb5153', 'IT', 2, '2-ci doza', '2nd dose', 150, '5 aylıq', '5 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('533acad0-1431-4b82-9bca-1c6cf2724d2f', '54db363f-635d-4f05-b6a3-525a2dbb5153', 'IT', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('5e6d3a26-323d-487a-a714-00396d51ab99', 'IT', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('63f44e1d-8d96-44c8-b626-200f5876b6ed', '5e6d3a26-323d-487a-a714-00396d51ab99', 'IT', 1, '1-ci doza', '1st dose', 90, '3 aylıq', '3 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3cc2d8c2-1d2f-4f35-a06f-9a7603fa28a1', '5e6d3a26-323d-487a-a714-00396d51ab99', 'IT', 2, '2-ci doza', '2nd dose', 150, '5 aylıq', '5 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c901e658-24c6-4719-8783-7d7b60a2b19c', '5e6d3a26-323d-487a-a714-00396d51ab99', 'IT', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('6913f958-d049-4eb6-9b6f-3f28d1b7d53a', 'IT', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('7a967c50-97f4-43c0-a7a1-2315915f8157', '6913f958-d049-4eb6-9b6f-3f28d1b7d53a', 'IT', 1, '1-ci doza', '1st dose', 90, '3 aylıq', '3 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('5a669492-28e1-4a00-9904-ddbc3fab9935', '6913f958-d049-4eb6-9b6f-3f28d1b7d53a', 'IT', 2, '2-ci doza', '2nd dose', 150, '5 aylıq', '5 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('ad1450fe-cc0f-497f-b2f2-f4cce956a23a', '6913f958-d049-4eb6-9b6f-3f28d1b7d53a', 'IT', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('9859d542-1491-496d-97cf-e11c12148ae0', 'IT', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('fdb5d53b-5775-4445-b176-52988cd4222c', '9859d542-1491-496d-97cf-e11c12148ae0', 'IT', 1, '1-ci doza', '1st dose', 90, '3 aylıq', '3 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3ad1fa58-3151-470a-85a3-6fbf9b85ba1a', '9859d542-1491-496d-97cf-e11c12148ae0', 'IT', 2, '2-ci doza', '2nd dose', 150, '5 aylıq', '5 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('8ca26bcc-3e18-40ce-87c3-aa32ed5e6108', '9859d542-1491-496d-97cf-e11c12148ae0', 'IT', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('b8f103df-7bb8-418b-94d7-5c3172164538', 'IT', 'RV', 'Rotavirus', 'Rotavirus', 'Rotavirus ishalı', 'Rotavirus diarrhea', 'Ağızdan', 'Oral', '#14B8A6', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('4b63cd77-7daa-4853-9265-0baddbcdb750', 'b8f103df-7bb8-418b-94d7-5c3172164538', 'IT', 1, '1-ci doza', '1st dose', 90, '3 aylıq', '3 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('86767407-00c1-4201-ba38-318864614edf', 'b8f103df-7bb8-418b-94d7-5c3172164538', 'IT', 2, '2-ci doza', '2nd dose', 150, '5 aylıq', '5 months', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('7fda4a6d-6b38-43ff-af77-15e77777a2fd', 'IT', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('eaa14862-a7d9-4b0a-b397-7547bbb07dff', '7fda4a6d-6b38-43ff-af77-15e77777a2fd', 'IT', 1, '1-ci doza', '1st dose', 395, '13 aylıq', '13-15 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('47f643bb-6cc1-4980-8639-07af6f933954', '7fda4a6d-6b38-43ff-af77-15e77777a2fd', 'IT', 2, '2-ci doza', '2nd dose', 1825, '5-6 yaş', '5-6 years', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('99de9f10-df11-4c99-8ef4-190a7888cdcf', 'IT', 'VAR', 'Su çiçəyi', 'Varicella (Chickenpox)', 'Su çiçəyi', 'Chickenpox', 'Dərialtı', 'Subcutaneous', '#6366F1', true, 17);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('148eac95-2633-4b75-9aa4-dcb7893df748', '99de9f10-df11-4c99-8ef4-190a7888cdcf', 'IT', 1, '1-ci doza', '1st dose', 395, '13 aylıq', '13-15 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b390a541-4e78-4e19-b2fa-c7d37be92cf2', '99de9f10-df11-4c99-8ef4-190a7888cdcf', 'IT', 2, '2-ci doza', '2nd dose', 1825, '5-6 yaş', '5-6 years', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('10483a0e-137f-4588-b11f-4b124ffd15f7', 'ES', 'İspaniya', 'Spain', '🇪🇸', 'https://www.sanidad.gob.es', 'Ministerio de Sanidad', 17);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('e1bb4ad4-911e-4558-b8a0-76fb56929bea', 'ES', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b46612b1-f0c5-4923-a795-effefafd25b9', 'e1bb4ad4-911e-4558-b8a0-76fb56929bea', 'ES', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('32fc0535-89b4-4a7f-ac22-22d98977bf67', 'e1bb4ad4-911e-4558-b8a0-76fb56929bea', 'ES', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('0272070c-fa15-4bef-8f84-f5a52b07b389', 'e1bb4ad4-911e-4558-b8a0-76fb56929bea', 'ES', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('e2615b6d-7ef4-4bd6-8a4d-b0674fbd4b80', 'ES', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e2de445d-9d8a-48a1-a21a-74f0ec301bac', 'e2615b6d-7ef4-4bd6-8a4d-b0674fbd4b80', 'ES', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a2ffbf2d-da52-4045-95bf-1c6ce098124f', 'e2615b6d-7ef4-4bd6-8a4d-b0674fbd4b80', 'ES', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('254f4aef-166d-4170-b1f5-11c1c1cf018a', 'e2615b6d-7ef4-4bd6-8a4d-b0674fbd4b80', 'ES', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('8b74d3f4-73ef-4bbb-a241-bcc82c518a46', 'ES', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('99107759-e0ef-46d4-8718-5762a555cf4d', '8b74d3f4-73ef-4bbb-a241-bcc82c518a46', 'ES', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b2ec5291-9d6f-43f2-83bf-35b6ec203239', '8b74d3f4-73ef-4bbb-a241-bcc82c518a46', 'ES', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('53a21e68-1402-4f67-b3f9-4a213a925d7e', '8b74d3f4-73ef-4bbb-a241-bcc82c518a46', 'ES', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('2a9c015f-b6f5-4adb-b4e1-c2a95233c8fb', 'ES', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('be54e5bd-bb43-4388-87d1-4986f34ae5dd', '2a9c015f-b6f5-4adb-b4e1-c2a95233c8fb', 'ES', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3091436f-4cd8-4d71-ba8c-a5599fbc3764', '2a9c015f-b6f5-4adb-b4e1-c2a95233c8fb', 'ES', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('4663f134-c529-443f-9d92-27bbb208c8f6', '2a9c015f-b6f5-4adb-b4e1-c2a95233c8fb', 'ES', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('baeee150-cd01-4f1f-abc0-33e041a7bc88', 'ES', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a21888e6-6f75-4195-9977-682fd0580826', 'baeee150-cd01-4f1f-abc0-33e041a7bc88', 'ES', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('7e1d10b4-7eea-4d46-a120-35747df4b270', 'baeee150-cd01-4f1f-abc0-33e041a7bc88', 'ES', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('054c3af1-2c2c-4982-8483-6a362841d10c', 'baeee150-cd01-4f1f-abc0-33e041a7bc88', 'ES', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('acb48710-1823-450d-b4dd-5a979e4b4a1a', 'ES', 'MenACWY', 'Meningokokk', 'Meningococcal', 'Meningokokk xəstəliyi', 'Meningococcal disease', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('1989112c-fb6f-4c4c-8062-fb85530da5fe', 'acb48710-1823-450d-b4dd-5a979e4b4a1a', 'ES', 1, '1-ci doza', '1st dose', 120, '4 aylıq', '4 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e375cf2c-b9b8-49dc-8c9a-d40d74d65c1d', 'acb48710-1823-450d-b4dd-5a979e4b4a1a', 'ES', 2, '2-ci doza', '2nd dose', 365, '12 aylıq', '12 months', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('c52f3b6b-529e-4777-85ad-67046121ca9b', 'ES', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('9ffddf19-9e84-4755-b7d4-c42828cf46b7', 'c52f3b6b-529e-4777-85ad-67046121ca9b', 'ES', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('dc766665-e10b-408f-932c-fb8706bb7c8c', 'c52f3b6b-529e-4777-85ad-67046121ca9b', 'ES', 2, '2-ci doza', '2nd dose', 1095, '3-4 yaş', '3-4 years', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('940c3b9e-a912-4d48-b36a-a8b4b12c6944', 'ES', 'VAR', 'Su çiçəyi', 'Varicella (Chickenpox)', 'Su çiçəyi', 'Chickenpox', 'Dərialtı', 'Subcutaneous', '#6366F1', true, 17);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('f82543bd-f031-4d0f-99bd-3ab49b8b274d', '940c3b9e-a912-4d48-b36a-a8b4b12c6944', 'ES', 1, '1-ci doza', '1st dose', 450, '15 aylıq', '15 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('eaca3428-46fc-4557-a0b6-01b25b4d4cd8', '940c3b9e-a912-4d48-b36a-a8b4b12c6944', 'ES', 2, '2-ci doza', '2nd dose', 1095, '3-4 yaş', '3-4 years', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('4c8344cd-73be-463a-876a-c070548d161b', 'CA', 'Kanada', 'Canada', '🇨🇦', 'https://www.canada.ca/en/public-health.html', 'Public Health Canada', 18);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('eb0d932d-bd15-41fa-b914-7614d75de165', 'CA', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('6ce6ece3-cd6c-4ce0-9880-c8f7743dd757', 'eb0d932d-bd15-41fa-b914-7614d75de165', 'CA', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('7a9a4b6b-cca5-4fde-adf4-f923604396f5', 'eb0d932d-bd15-41fa-b914-7614d75de165', 'CA', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('fed92a66-e776-488a-988a-1147bd35e5f1', 'eb0d932d-bd15-41fa-b914-7614d75de165', 'CA', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('6b5f7ffa-be60-49fd-b1c1-6128aa0df76c', 'eb0d932d-bd15-41fa-b914-7614d75de165', 'CA', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('04a0d2f0-d736-4993-8160-7f2b452a265d', 'CA', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('600bca1d-76d1-422d-b12b-8f59898a5cad', '04a0d2f0-d736-4993-8160-7f2b452a265d', 'CA', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('114f8bd0-403a-46ce-8bff-6597b82e629c', '04a0d2f0-d736-4993-8160-7f2b452a265d', 'CA', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('f9ad226a-abbc-4c7f-ae06-e692f3f6cf18', '04a0d2f0-d736-4993-8160-7f2b452a265d', 'CA', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('765e21d7-186e-4dc6-905a-e41dddea9155', '04a0d2f0-d736-4993-8160-7f2b452a265d', 'CA', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('a82db760-7d10-497f-9ee2-3e4136e49aaa', 'CA', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('6bf6aa56-233e-41b4-95e2-11d229f6d950', 'a82db760-7d10-497f-9ee2-3e4136e49aaa', 'CA', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('4c5ddae3-fd86-4103-bb41-bd0a23b11206', 'a82db760-7d10-497f-9ee2-3e4136e49aaa', 'CA', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('21995f53-50db-4f20-8cf4-e20b63c73cea', 'a82db760-7d10-497f-9ee2-3e4136e49aaa', 'CA', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('024a02e3-ba99-4c4d-b59e-1db414750a28', 'a82db760-7d10-497f-9ee2-3e4136e49aaa', 'CA', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('de8998c6-77fd-4d3f-962b-c6dd72995e0e', 'CA', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('40ff9c21-0bdc-4d58-9fef-2b886956f9dc', 'de8998c6-77fd-4d3f-962b-c6dd72995e0e', 'CA', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('86019a41-ca8a-4e71-bf12-2355766f4a1c', 'de8998c6-77fd-4d3f-962b-c6dd72995e0e', 'CA', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('5e0791c9-18ea-48b9-ba22-ae72c4faf747', 'de8998c6-77fd-4d3f-962b-c6dd72995e0e', 'CA', 3, '3-ci doza', '3rd dose', 365, '12 aylıq', '12 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('de6fb444-e7e7-4d6c-b184-489aa9b224ca', 'CA', 'RV', 'Rotavirus', 'Rotavirus', 'Rotavirus ishalı', 'Rotavirus diarrhea', 'Ağızdan', 'Oral', '#14B8A6', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e0219b1b-22db-4b26-8df2-52b2be3c5c88', 'de6fb444-e7e7-4d6c-b184-489aa9b224ca', 'CA', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3a08e2fb-01a8-4866-b74e-9b326897a7b5', 'de6fb444-e7e7-4d6c-b184-489aa9b224ca', 'CA', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('e022468f-59f5-4c12-af76-946e222389cd', 'CA', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('06d5f3f0-c845-4fd1-bb61-34bacbf3bd78', 'e022468f-59f5-4c12-af76-946e222389cd', 'CA', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('50e14b7c-4afc-42b7-8b3b-85671fdabb35', 'e022468f-59f5-4c12-af76-946e222389cd', 'CA', 2, '2-ci doza', '2nd dose', 540, '18 aylıq', '18 months', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('75dd85a7-c1b7-4b97-8bd0-d1243dcc3447', 'CA', 'MenACWY', 'Meningokokk', 'Meningococcal', 'Meningokokk xəstəliyi', 'Meningococcal disease', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('378994f2-b5c7-404e-800a-2bbd4a392407', '75dd85a7-c1b7-4b97-8bd0-d1243dcc3447', 'CA', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('2dfad9b7-d4a5-40b1-9331-e193a4051dc9', 'AU', 'Avstraliya', 'Australia', '🇦🇺', 'https://www.health.gov.au/', 'Dept of Health AU', 19);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('95650afa-bdcb-44c8-adfe-d350646ff65b', 'AU', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('0e453915-6a04-4231-9f87-c4e9df67b112', '95650afa-bdcb-44c8-adfe-d350646ff65b', 'AU', 1, '1-ci doza', '1st dose', 0, 'Doğulanda', 'At birth', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3f7d3862-d374-4c13-8c31-505c17a7d3c7', '95650afa-bdcb-44c8-adfe-d350646ff65b', 'AU', 2, '2-ci doza', '2nd dose', 60, '2 aylıq', '2 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e1678cbd-8084-449f-813b-02b472decad0', '95650afa-bdcb-44c8-adfe-d350646ff65b', 'AU', 3, '3-ci doza', '3rd dose', 120, '4 aylıq', '4 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('6ceedd9f-eb44-4391-9e72-e72f4aea1a9d', '95650afa-bdcb-44c8-adfe-d350646ff65b', 'AU', 4, '4-ci doza', '4th dose', 180, '6 aylıq', '6 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('9d9f36a7-7741-4fd9-aec1-09bd924264b6', 'AU', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('7967415c-968b-4940-9718-48a4750424b7', '9d9f36a7-7741-4fd9-aec1-09bd924264b6', 'AU', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('48d44392-76ef-4923-9ea8-3b6202424ba8', '9d9f36a7-7741-4fd9-aec1-09bd924264b6', 'AU', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('8138dba7-3e5f-4fb3-9b8b-d2d524167ca2', '9d9f36a7-7741-4fd9-aec1-09bd924264b6', 'AU', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('18070d84-2289-43b4-90f9-cd7698406962', '9d9f36a7-7741-4fd9-aec1-09bd924264b6', 'AU', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('822f4ef5-c210-46d1-b3ba-e735953b403c', 'AU', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c8a4734f-a610-4053-8bb0-edc1a2b5e003', '822f4ef5-c210-46d1-b3ba-e735953b403c', 'AU', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('23bd41c4-77ad-46ce-9aa5-0f24272cdb95', '822f4ef5-c210-46d1-b3ba-e735953b403c', 'AU', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('ddb25e74-7e52-4fc8-9a24-12febf4ffa60', '822f4ef5-c210-46d1-b3ba-e735953b403c', 'AU', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('723c7d4f-06ac-4834-8296-82e93334a792', 'AU', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('1f2b4fea-f02e-46ce-bce2-a43bf4310491', '723c7d4f-06ac-4834-8296-82e93334a792', 'AU', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('91e66393-32ba-4ec0-a94d-114845e861ea', '723c7d4f-06ac-4834-8296-82e93334a792', 'AU', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c788066a-49a4-436f-9a33-470da4bd365e', '723c7d4f-06ac-4834-8296-82e93334a792', 'AU', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('4f6c3ac0-f8d1-4710-bcb1-674dcbf909b6', '723c7d4f-06ac-4834-8296-82e93334a792', 'AU', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('1949822c-d2fe-4b62-9851-80ace0613d4d', 'AU', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('9c78ccfe-a998-4e22-9ec7-083b8f93803e', '1949822c-d2fe-4b62-9851-80ace0613d4d', 'AU', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e0fb4165-cd1b-4333-979d-51501dbdd662', '1949822c-d2fe-4b62-9851-80ace0613d4d', 'AU', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('4423a277-79ab-4fba-9468-33b876106f0a', '1949822c-d2fe-4b62-9851-80ace0613d4d', 'AU', 3, '3-ci doza', '3rd dose', 365, '12 aylıq', '12 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('0fa6d5d1-d1c6-426c-aa58-d2066dfc74dc', 'AU', 'RV', 'Rotavirus', 'Rotavirus', 'Rotavirus ishalı', 'Rotavirus diarrhea', 'Ağızdan', 'Oral', '#14B8A6', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('d0fc6b2b-b43b-4be8-90a3-b0c143efc33a', '0fa6d5d1-d1c6-426c-aa58-d2066dfc74dc', 'AU', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('230f79e3-0c3d-4c3e-9986-3344668c8b0b', '0fa6d5d1-d1c6-426c-aa58-d2066dfc74dc', 'AU', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('b29c4d11-5721-4bb1-8cd1-3a30a0413f92', 'AU', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('2ade7615-e442-4680-9948-acd388363580', 'b29c4d11-5721-4bb1-8cd1-3a30a0413f92', 'AU', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('1abbb84d-219e-4496-8c5e-95dd6c97759f', 'b29c4d11-5721-4bb1-8cd1-3a30a0413f92', 'AU', 2, '2-ci doza', '2nd dose', 540, '18 aylıq', '18 months', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('a767a92b-ea3d-4de2-b9a4-114e0cfbfeed', 'AE', 'Birləşmiş Ərəb Əmirlikləri', 'United Arab Emirates', '🇦🇪', 'https://www.mohap.gov.ae/', 'MOHAP UAE', 20);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('e77d46c9-25b5-4bd4-b873-22216cc390f8', 'AE', 'BCG', 'Vərəm (BCG)', 'Tuberculosis (BCG)', 'Vərəm', 'Tuberculosis', 'Dəridaxili', 'Intradermal', '#10B981', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('0b645d84-a882-4874-9384-9aef87a3bb9a', 'e77d46c9-25b5-4bd4-b873-22216cc390f8', 'AE', 1, '1-ci doza', '1st dose', 0, 'Doğulanda', 'At birth', 10);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('d54fcefb-967f-43b2-9b9a-508e950d69e8', 'AE', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c24886ae-08b1-43e4-b816-e2aa48e11ccc', 'd54fcefb-967f-43b2-9b9a-508e950d69e8', 'AE', 1, '1-ci doza', '1st dose', 0, 'Doğulanda', 'At birth', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('781ba0c5-12d9-47d8-a246-f3b46c504104', 'd54fcefb-967f-43b2-9b9a-508e950d69e8', 'AE', 2, '2-ci doza', '2nd dose', 60, '2 aylıq', '2 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('778100a6-b20f-4f67-aaf7-98d7b50c8af8', 'd54fcefb-967f-43b2-9b9a-508e950d69e8', 'AE', 3, '3-ci doza', '3rd dose', 120, '4 aylıq', '4 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('1e1c3434-86a3-42b3-806e-54daf8d330b3', 'd54fcefb-967f-43b2-9b9a-508e950d69e8', 'AE', 4, '4-ci doza', '4th dose', 180, '6 aylıq', '6 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('c8ab5ee8-39a5-401f-a0cd-ce19b15845d7', 'AE', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('1b857966-d0bd-4dda-a2b7-638daa36bcba', 'c8ab5ee8-39a5-401f-a0cd-ce19b15845d7', 'AE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('6eb418a5-50c3-4be7-9709-69441e4c1bae', 'c8ab5ee8-39a5-401f-a0cd-ce19b15845d7', 'AE', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('0733b67c-e9b8-4d69-b3ff-a1c3900c319b', 'c8ab5ee8-39a5-401f-a0cd-ce19b15845d7', 'AE', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('ddda6358-a40e-4d54-9482-4bdcaff83b7c', 'c8ab5ee8-39a5-401f-a0cd-ce19b15845d7', 'AE', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('ac87be28-db4f-47f1-9a88-5b69dce1af24', 'AE', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('5ff8b09b-96b2-4bc5-ae93-6ff7ce56f737', 'ac87be28-db4f-47f1-9a88-5b69dce1af24', 'AE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('d742f4ce-d2f5-4506-b673-850e140f7da4', 'ac87be28-db4f-47f1-9a88-5b69dce1af24', 'AE', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('cc4bd27a-7cfe-4fb4-ad9b-9cdcbc058c73', 'ac87be28-db4f-47f1-9a88-5b69dce1af24', 'AE', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('8b5b5495-1a5d-4e7f-9358-96e5c7217355', 'ac87be28-db4f-47f1-9a88-5b69dce1af24', 'AE', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('d150dda4-99bc-4cbb-b999-450b355babc9', 'AE', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e2b53d1a-3a33-4566-bf60-9dc4ea88424c', 'd150dda4-99bc-4cbb-b999-450b355babc9', 'AE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3f788fc7-3860-4b3a-b31f-4a34b4a6644a', 'd150dda4-99bc-4cbb-b999-450b355babc9', 'AE', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('002ae3d8-c0b1-4f21-91c7-7f9fe5666d83', 'd150dda4-99bc-4cbb-b999-450b355babc9', 'AE', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('06d06ae4-8f24-418a-b3c6-faaee3260453', 'AE', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('fe1f47c0-c854-483d-95dd-3ccbd53fefb9', '06d06ae4-8f24-418a-b3c6-faaee3260453', 'AE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c79285e4-3220-4b7c-aa5b-e86a285fef20', '06d06ae4-8f24-418a-b3c6-faaee3260453', 'AE', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('4adf7716-3466-4178-81b7-1183bf8ad96e', '06d06ae4-8f24-418a-b3c6-faaee3260453', 'AE', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('3d2324a3-a7bb-4f7a-ba53-c7110951e571', 'AE', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('2db15222-33a3-4ef2-b9ae-8585cdd00311', '3d2324a3-a7bb-4f7a-ba53-c7110951e571', 'AE', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('cac22c8f-fa05-402f-b007-a5da78883f9e', '3d2324a3-a7bb-4f7a-ba53-c7110951e571', 'AE', 2, '2-ci doza', '2nd dose', 1825, '5-6 yaş', '5-6 years', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('9dbf8da6-85f2-4fb6-b2e1-9d3e2145eb2a', 'AE', 'VAR', 'Su çiçəyi', 'Varicella (Chickenpox)', 'Su çiçəyi', 'Chickenpox', 'Dərialtı', 'Subcutaneous', '#6366F1', true, 17);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('ec164f84-c4cc-4d85-9af1-be154a23ee12', '9dbf8da6-85f2-4fb6-b2e1-9d3e2145eb2a', 'AE', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('8d2a126a-6c37-48c0-a3e7-142b41ca972e', '9dbf8da6-85f2-4fb6-b2e1-9d3e2145eb2a', 'AE', 2, '2-ci doza', '2nd dose', 1825, '5-6 yaş', '5-6 years', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('d0dec12b-e00e-446e-ab92-6c7395e73275', 'SA', 'Səudiyyə Ərəbistanı', 'Saudi Arabia', '🇸🇦', 'https://www.moh.gov.sa/', 'MOH SA', 21);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('24d36f7d-4d74-4d87-9583-1ec4df1b61cb', 'SA', 'BCG', 'Vərəm (BCG)', 'Tuberculosis (BCG)', 'Vərəm', 'Tuberculosis', 'Dəridaxili', 'Intradermal', '#10B981', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('eeb55f09-4467-4e37-954c-8324ba9f94cb', '24d36f7d-4d74-4d87-9583-1ec4df1b61cb', 'SA', 1, '1-ci doza', '1st dose', 0, 'Doğulanda', 'At birth', 10);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('5ba4264a-993b-413c-8676-1e0a9e321a99', 'SA', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c4914b04-8b0a-4487-a16f-27434dd8961a', '5ba4264a-993b-413c-8676-1e0a9e321a99', 'SA', 1, '1-ci doza', '1st dose', 0, 'Doğulanda', 'At birth', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('418ca893-5a23-4f17-afa5-fa8f1091625e', '5ba4264a-993b-413c-8676-1e0a9e321a99', 'SA', 2, '2-ci doza', '2nd dose', 60, '2 aylıq', '2 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('58333800-3dbd-4180-915c-3bb70454ae65', '5ba4264a-993b-413c-8676-1e0a9e321a99', 'SA', 3, '3-ci doza', '3rd dose', 120, '4 aylıq', '4 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('28dc5b20-d559-44db-b341-03a9e4062c65', '5ba4264a-993b-413c-8676-1e0a9e321a99', 'SA', 4, '4-ci doza', '4th dose', 180, '6 aylıq', '6 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('94b556e3-c053-46ce-9c0b-66b51aed9432', 'SA', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('cb20aa55-a4aa-4fa3-b7a8-794926eba54c', '94b556e3-c053-46ce-9c0b-66b51aed9432', 'SA', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('543ff9a4-77c5-410e-bfb9-7b895844c7f7', '94b556e3-c053-46ce-9c0b-66b51aed9432', 'SA', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3612e0cf-1432-48fc-981a-44163d339b76', '94b556e3-c053-46ce-9c0b-66b51aed9432', 'SA', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('627cdc6f-49cd-473c-aebc-c5c2a5f1d0dc', 'SA', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('6b7dd011-5a6f-4cf2-b8fa-0e76fbcd82ed', '627cdc6f-49cd-473c-aebc-c5c2a5f1d0dc', 'SA', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a27abe21-b340-43b1-86f3-ad821c84246e', '627cdc6f-49cd-473c-aebc-c5c2a5f1d0dc', 'SA', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c0b55a01-b4e3-4249-a1c9-e3dff9d4c4b1', '627cdc6f-49cd-473c-aebc-c5c2a5f1d0dc', 'SA', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('6ff8bacf-5347-4255-bf5a-d43a78324555', 'SA', 'RV', 'Rotavirus', 'Rotavirus', 'Rotavirus ishalı', 'Rotavirus diarrhea', 'Ağızdan', 'Oral', '#14B8A6', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('27fa118d-b67c-482f-99a9-7b7866caf0ad', '6ff8bacf-5347-4255-bf5a-d43a78324555', 'SA', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('fa00b841-bbfa-495b-b06e-77cc4d3a567d', '6ff8bacf-5347-4255-bf5a-d43a78324555', 'SA', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('260f1fdc-21a7-4957-bbe0-dc47022e9057', 'SA', 'MenACWY', 'Meningokokk', 'Meningococcal', 'Meningokokk xəstəliyi', 'Meningococcal disease', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('70b42eb4-b1ff-4817-8fad-b73ebe2943eb', '260f1fdc-21a7-4957-bbe0-dc47022e9057', 'SA', 1, '1-ci doza', '1st dose', 270, '9 aylıq', '9 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('ae2ed96e-40c2-4058-a31f-3f682a556650', '260f1fdc-21a7-4957-bbe0-dc47022e9057', 'SA', 2, '2-ci doza', '2nd dose', 365, '12 aylıq', '12 months', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('f4ed0b16-c67c-4ebd-abfd-5bfa0f219407', 'SA', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('70e5a49c-2d5d-4f1d-bec0-54c9ae4026d4', 'f4ed0b16-c67c-4ebd-abfd-5bfa0f219407', 'SA', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('82ade01a-0aa6-49ce-9ae9-3367bf7f85c5', 'f4ed0b16-c67c-4ebd-abfd-5bfa0f219407', 'SA', 2, '2-ci doza', '2nd dose', 540, '18 aylıq', '18 months', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('84493d5c-cdbc-443b-b267-bf8514cae8ff', 'SA', 'HepA', 'Hepatit A', 'Hepatitis A', 'Hepatit A virusu', 'Hepatitis A virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 17);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('52f369c2-1600-49f3-acb3-e28fe0287d88', '84493d5c-cdbc-443b-b267-bf8514cae8ff', 'SA', 1, '1-ci doza', '1st dose', 540, '18 aylıq', '18 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('8d0a861b-932b-4209-9562-51b0b0613598', '84493d5c-cdbc-443b-b267-bf8514cae8ff', 'SA', 2, '2-ci doza', '2nd dose', 730, '24 aylıq', '24 months', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('b2026ea2-597b-4861-8f59-a1e1a4d7cd74', 'KZ', 'Qazaxıstan', 'Kazakhstan', '🇰🇿', 'https://egov.kz/', 'eGov KZ', 22);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('c9155088-5611-4448-89f9-7e5afad94059', 'KZ', 'BCG', 'Vərəm (BCG)', 'Tuberculosis (BCG)', 'Vərəm', 'Tuberculosis', 'Dəridaxili', 'Intradermal', '#10B981', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('8089be99-1398-4756-af35-98f41e9722a6', 'c9155088-5611-4448-89f9-7e5afad94059', 'KZ', 1, '1-ci doza', '1st dose', 3, '1-4 gün', '1-4 days', 10);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('d1f6ab22-915b-41e0-b535-5a08a920f71b', 'KZ', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('92c06c0b-4b5c-4435-879d-61b8ea4f0ed3', 'd1f6ab22-915b-41e0-b535-5a08a920f71b', 'KZ', 1, '1-ci doza', '1st dose', 3, '1-4 gün', '1-4 days', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e8cbe76f-d85c-45da-8c87-ae3945756d56', 'd1f6ab22-915b-41e0-b535-5a08a920f71b', 'KZ', 2, '2-ci doza', '2nd dose', 60, '2 aylıq', '2 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('df916aab-021c-41f5-8fde-b99f4fa7f916', 'd1f6ab22-915b-41e0-b535-5a08a920f71b', 'KZ', 3, '3-ci doza', '3rd dose', 120, '4 aylıq', '4 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('976bbc66-4b72-4771-a341-1e31b6846e41', 'KZ', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('00dfe94a-7f4d-4a3a-86fc-e9a9a7069629', '976bbc66-4b72-4771-a341-1e31b6846e41', 'KZ', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e0bd931a-1cc4-44c2-ab5a-b7e62e77feb5', '976bbc66-4b72-4771-a341-1e31b6846e41', 'KZ', 2, '2-ci doza', '2nd dose', 90, '3 aylıq', '3 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3c517581-88ee-4d2d-9b18-fb229cb66fc9', '976bbc66-4b72-4771-a341-1e31b6846e41', 'KZ', 3, '3-ci doza', '3rd dose', 120, '4 aylıq', '4 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('9852c261-e81d-452f-8db2-fbb9171d0f6d', '976bbc66-4b72-4771-a341-1e31b6846e41', 'KZ', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('1f6c3bbd-3c46-4eef-acbf-d25497bb6982', 'KZ', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('cb753eb6-3da3-4ff2-93bc-b45afbf963cf', '1f6c3bbd-3c46-4eef-acbf-d25497bb6982', 'KZ', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('dd57305d-ca45-4fe8-a79d-cccade05c32f', '1f6c3bbd-3c46-4eef-acbf-d25497bb6982', 'KZ', 2, '2-ci doza', '2nd dose', 90, '3 aylıq', '3 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('0b32f1c7-1407-43ab-9eee-6a89538b456c', '1f6c3bbd-3c46-4eef-acbf-d25497bb6982', 'KZ', 3, '3-ci doza', '3rd dose', 120, '4 aylıq', '4 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('d5a36738-3993-4f37-b40f-8fda30ed74cf', '1f6c3bbd-3c46-4eef-acbf-d25497bb6982', 'KZ', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('6588a440-a71a-4ef1-ba8b-515f93e95aab', 'KZ', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('ffc66979-e677-45b5-9dff-027dd6164533', '6588a440-a71a-4ef1-ba8b-515f93e95aab', 'KZ', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('08960e88-6ea4-4ac3-9a70-c11cb4da0040', '6588a440-a71a-4ef1-ba8b-515f93e95aab', 'KZ', 2, '2-ci doza', '2nd dose', 90, '3 aylıq', '3 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('980c1a77-be40-4933-bfd1-cf16e9b89768', '6588a440-a71a-4ef1-ba8b-515f93e95aab', 'KZ', 3, '3-ci doza', '3rd dose', 120, '4 aylıq', '4 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a4db6975-ac5c-4b5b-89ed-dea70cdd8889', '6588a440-a71a-4ef1-ba8b-515f93e95aab', 'KZ', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('6a829669-e0be-4094-9686-8791f7dc28d8', 'KZ', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('68b8d324-d62a-4d2e-8c96-8d80def1a3eb', '6a829669-e0be-4094-9686-8791f7dc28d8', 'KZ', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('93987f34-c415-4538-ab51-7d651a2f7189', '6a829669-e0be-4094-9686-8791f7dc28d8', 'KZ', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('bddb1555-06d0-4a4a-ba3a-f3d60f4b8c80', '6a829669-e0be-4094-9686-8791f7dc28d8', 'KZ', 3, '3-ci doza', '3rd dose', 365, '12 aylıq', '12 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('b5edff65-666b-4215-b160-c62bd79630fc', 'KZ', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('d4985827-d5ca-405e-9ba4-789597d16a84', 'b5edff65-666b-4215-b160-c62bd79630fc', 'KZ', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('301b1fdc-ea9d-4207-b893-be2109ba27ec', 'b5edff65-666b-4215-b160-c62bd79630fc', 'KZ', 2, '2-ci doza', '2nd dose', 2190, '6 yaş', '6 years', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('7e1bf2ce-d4d3-4031-965e-63a9020cd564', 'GE', 'Gürcüstan', 'Georgia', '🇬🇪', 'https://ncdc.ge/', 'NCDC Georgia', 23);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('579ed15c-e9d6-40f2-a6d3-f5e2a9d33398', 'GE', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c18e65b6-3f53-4eb0-a231-36832102e502', '579ed15c-e9d6-40f2-a6d3-f5e2a9d33398', 'GE', 1, '1-ci doza', '1st dose', 0, 'Doğulanda', 'At birth', 10);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('f3fb6bce-26fd-4d72-ad11-14cfea91f865', 'GE', 'BCG', 'Vərəm (BCG)', 'Tuberculosis (BCG)', 'Vərəm', 'Tuberculosis', 'Dəridaxili', 'Intradermal', '#10B981', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('4dbacbee-4ae2-4c62-b780-3ca968c12096', 'f3fb6bce-26fd-4d72-ad11-14cfea91f865', 'GE', 1, '1-ci doza', '1st dose', 3, '0-5 gün', '0-5 days', 10);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('49c9eb47-9973-496f-a344-aca92d64dce5', 'GE', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('eaf06157-0918-458d-8e55-d473e7359838', '49c9eb47-9973-496f-a344-aca92d64dce5', 'GE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('d3d58862-401e-4f1e-ad11-3fe602445fc7', '49c9eb47-9973-496f-a344-aca92d64dce5', 'GE', 2, '2-ci doza', '2nd dose', 90, '3 aylıq', '3 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('046e06a3-8f6f-492d-aa95-eb4f53fa977b', '49c9eb47-9973-496f-a344-aca92d64dce5', 'GE', 3, '3-ci doza', '3rd dose', 120, '4 aylıq', '4 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('dfcd9e89-2b82-46de-ab7c-e55d6abad1b1', '49c9eb47-9973-496f-a344-aca92d64dce5', 'GE', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('fd3ea215-df7a-4a5b-9ae6-2bb0b4257e20', 'GE', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('4c07cc93-4df7-4464-80f7-8e080e632fb1', 'fd3ea215-df7a-4a5b-9ae6-2bb0b4257e20', 'GE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('de7c57c0-d064-4041-93c5-9bedfb31d084', 'fd3ea215-df7a-4a5b-9ae6-2bb0b4257e20', 'GE', 2, '2-ci doza', '2nd dose', 90, '3 aylıq', '3 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('5b7f4db0-f106-429b-bcfb-bc8682d8b947', 'fd3ea215-df7a-4a5b-9ae6-2bb0b4257e20', 'GE', 3, '3-ci doza', '3rd dose', 120, '4 aylıq', '4 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('71ed22d5-0028-463d-8874-54a47f4f9ceb', 'GE', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('6aea4fc0-2be2-4e7f-a399-6c290bc6462e', '71ed22d5-0028-463d-8874-54a47f4f9ceb', 'GE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('f3b4ae05-da00-4a0b-b179-df5583b3e7b9', '71ed22d5-0028-463d-8874-54a47f4f9ceb', 'GE', 2, '2-ci doza', '2nd dose', 90, '3 aylıq', '3 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('616ad630-4573-44d7-8936-f982b0bb12c7', '71ed22d5-0028-463d-8874-54a47f4f9ceb', 'GE', 3, '3-ci doza', '3rd dose', 120, '4 aylıq', '4 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('fdc742b7-1993-4c01-8b1e-4bf9182c70f0', 'GE', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('4cf91cc0-ed5b-48bd-9a92-220ea239a139', 'fdc742b7-1993-4c01-8b1e-4bf9182c70f0', 'GE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('24fe0c88-fe60-4309-bd6f-06a4575dec46', 'fdc742b7-1993-4c01-8b1e-4bf9182c70f0', 'GE', 2, '2-ci doza', '2nd dose', 90, '3 aylıq', '3 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a99dec36-b7ec-4dda-9161-abc2d81c38c6', 'fdc742b7-1993-4c01-8b1e-4bf9182c70f0', 'GE', 3, '3-ci doza', '3rd dose', 365, '12 aylıq', '12 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('9f676f3c-f1f5-43d6-828b-5a195ebd5e6f', 'GE', 'RV', 'Rotavirus', 'Rotavirus', 'Rotavirus ishalı', 'Rotavirus diarrhea', 'Ağızdan', 'Oral', '#14B8A6', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('f18c5782-8714-4b45-8c96-1ea677a2f2d7', '9f676f3c-f1f5-43d6-828b-5a195ebd5e6f', 'GE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a75b1d24-0928-496a-9190-acc789f8414a', '9f676f3c-f1f5-43d6-828b-5a195ebd5e6f', 'GE', 2, '2-ci doza', '2nd dose', 90, '3 aylıq', '3 months', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('780b6a8b-c359-4a83-b902-8924cbca5650', 'GE', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 17);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('dda64262-e814-4199-b674-a2794a3cc42c', '780b6a8b-c359-4a83-b902-8924cbca5650', 'GE', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('ac6fa097-ae70-4fed-be05-510f4678d5e8', '780b6a8b-c359-4a83-b902-8924cbca5650', 'GE', 2, '2-ci doza', '2nd dose', 1825, '5 yaş', '5 years', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('ce93caf3-cf48-4c69-bfbf-8a72edaf89e3', 'UA', 'Ukrayna', 'Ukraine', '🇺🇦', 'https://moz.gov.ua/', 'МОЗ України', 24);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('3bf1aa87-af9e-4d5d-a1a4-7fa5d86aa0aa', 'UA', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('0f969b61-2076-40cb-afa9-57491ead3a9e', '3bf1aa87-af9e-4d5d-a1a4-7fa5d86aa0aa', 'UA', 1, '1-ci doza', '1st dose', 0, 'Doğulanda', 'At birth', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('fa5accca-422a-46c3-973c-73804dc0ecae', '3bf1aa87-af9e-4d5d-a1a4-7fa5d86aa0aa', 'UA', 2, '2-ci doza', '2nd dose', 60, '2 aylıq', '2 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('7e93bf13-8615-4e32-b8dd-114965167acb', '3bf1aa87-af9e-4d5d-a1a4-7fa5d86aa0aa', 'UA', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('4f1c8771-38a5-4783-8a45-2499b9296d40', 'UA', 'BCG', 'Vərəm (BCG)', 'Tuberculosis (BCG)', 'Vərəm', 'Tuberculosis', 'Dəridaxili', 'Intradermal', '#10B981', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('581c4945-6692-4100-83c3-41c879fa07d9', '4f1c8771-38a5-4783-8a45-2499b9296d40', 'UA', 1, '1-ci doza', '1st dose', 4, '3-5 gün', '3-5 days', 10);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('b8c4f057-99ae-4d70-b6e1-3c559c9875b1', 'UA', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('cb7ebb5a-66bf-4aa0-966b-2640094fa9b7', 'b8c4f057-99ae-4d70-b6e1-3c559c9875b1', 'UA', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e1bfc933-e65f-4a62-a042-cc8cb999469a', 'b8c4f057-99ae-4d70-b6e1-3c559c9875b1', 'UA', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('831b02c7-04d4-41e4-b3c0-06986514f34e', 'b8c4f057-99ae-4d70-b6e1-3c559c9875b1', 'UA', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('00dfd792-bcb5-4cfc-a5d1-b757c36bc0e0', 'b8c4f057-99ae-4d70-b6e1-3c559c9875b1', 'UA', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('fcff6bf3-1842-4179-a6b2-49637423787b', 'UA', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('7fd1aa80-e8fa-4f15-b4e7-391ae633d12f', 'fcff6bf3-1842-4179-a6b2-49637423787b', 'UA', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('698121bd-ffe8-4ecc-8dba-e9d92ceeb4fd', 'fcff6bf3-1842-4179-a6b2-49637423787b', 'UA', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('d03d8b98-ba47-408e-bf79-45e57819c7cf', 'fcff6bf3-1842-4179-a6b2-49637423787b', 'UA', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('5da92c5c-9d25-4c52-8519-3159311e9975', 'fcff6bf3-1842-4179-a6b2-49637423787b', 'UA', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('7aaa8e53-135a-499c-af1b-a137b55b404b', 'UA', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e08e9746-bf09-4703-8ee6-747753a445da', '7aaa8e53-135a-499c-af1b-a137b55b404b', 'UA', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e9a079f6-b723-4472-80f4-ebebfcfc2647', '7aaa8e53-135a-499c-af1b-a137b55b404b', 'UA', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b8ad1aeb-d70f-47de-b6ff-753f032e25e4', '7aaa8e53-135a-499c-af1b-a137b55b404b', 'UA', 3, '3-ci doza', '3rd dose', 365, '12 aylıq', '12 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('5cb44a14-a30e-46c2-919b-1bc391c4d7ed', 'UA', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('31f6c3b8-24c3-484e-894c-7925692aa84e', '5cb44a14-a30e-46c2-919b-1bc391c4d7ed', 'UA', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b02c6423-c06c-4a53-ba2c-c3b6f6436e13', '5cb44a14-a30e-46c2-919b-1bc391c4d7ed', 'UA', 2, '2-ci doza', '2nd dose', 2190, '6 yaş', '6 years', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('40d499d2-ea32-4120-9ecd-96f994e06dd0', 'UZ', 'Özbəkistan', 'Uzbekistan', '🇺🇿', 'https://ssv.uz/', 'Sog‘liqni Saqlash Vazirligi', 25);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('50feb174-d170-4a51-845d-dec0057230e5', 'UZ', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('d664d2fa-259a-4d0b-a761-e1180a326174', '50feb174-d170-4a51-845d-dec0057230e5', 'UZ', 1, '1-ci doza', '1st dose', 0, 'Doğulanda', 'At birth', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('6b2e4958-551a-428b-abb9-209e02332dab', '50feb174-d170-4a51-845d-dec0057230e5', 'UZ', 2, '2-ci doza', '2nd dose', 60, '2 aylıq', '2 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('7fc06197-1be1-4635-8418-fe86e6382b52', '50feb174-d170-4a51-845d-dec0057230e5', 'UZ', 3, '3-ci doza', '3rd dose', 90, '3 aylıq', '3 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b3cb0308-fcdf-4a35-846c-cee79481098b', '50feb174-d170-4a51-845d-dec0057230e5', 'UZ', 4, '4-ci doza', '4th dose', 120, '4 aylıq', '4 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('7f1888f3-8855-4d3d-82fd-350185c1ce34', 'UZ', 'BCG', 'Vərəm (BCG)', 'Tuberculosis (BCG)', 'Vərəm', 'Tuberculosis', 'Dəridaxili', 'Intradermal', '#10B981', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('ebb4de77-971a-4817-9bd2-c91e52d47769', '7f1888f3-8855-4d3d-82fd-350185c1ce34', 'UZ', 1, '1-ci doza', '1st dose', 3, '2-5 gün', '2-5 days', 10);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('b7455766-4c7a-4530-ab8d-9e8e98ee286b', 'UZ', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('8aba6f9d-a933-4284-b031-8b875f6f082b', 'b7455766-4c7a-4530-ab8d-9e8e98ee286b', 'UZ', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c3fcd71a-0c86-4c21-8ca4-c2bc88fbcd98', 'b7455766-4c7a-4530-ab8d-9e8e98ee286b', 'UZ', 2, '2-ci doza', '2nd dose', 90, '3 aylıq', '3 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('aa6e2f7f-196b-46e4-b4e9-19e5d8b00734', 'b7455766-4c7a-4530-ab8d-9e8e98ee286b', 'UZ', 3, '3-ci doza', '3rd dose', 120, '4 aylıq', '4 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('2a427e53-042c-45e6-a3a2-a6bba6c5a9d4', 'b7455766-4c7a-4530-ab8d-9e8e98ee286b', 'UZ', 4, '4-ci doza', '4th dose', 480, '16 aylıq', '16 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('d2ea5094-a0f8-41c6-8064-808f7a3a2a3c', 'UZ', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('911054b7-0f9e-4b9a-8f24-1af358065512', 'd2ea5094-a0f8-41c6-8064-808f7a3a2a3c', 'UZ', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('35cc6bd9-cbee-4566-8131-279dc6c8be6b', 'd2ea5094-a0f8-41c6-8064-808f7a3a2a3c', 'UZ', 2, '2-ci doza', '2nd dose', 90, '3 aylıq', '3 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('63982ae1-e390-4e47-bd67-344a079c8a6c', 'd2ea5094-a0f8-41c6-8064-808f7a3a2a3c', 'UZ', 3, '3-ci doza', '3rd dose', 120, '4 aylıq', '4 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('db1cf5e7-8464-4d15-81b5-cde8ad0ede7b', 'UZ', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('cd802857-c486-44fa-93d3-bb737ce792cc', 'db1cf5e7-8464-4d15-81b5-cde8ad0ede7b', 'UZ', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('37dc7c95-5bef-48fa-bf0f-f8ab165ab3a3', 'db1cf5e7-8464-4d15-81b5-cde8ad0ede7b', 'UZ', 2, '2-ci doza', '2nd dose', 90, '3 aylıq', '3 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('4cc319d3-44f3-4b2b-b638-8363349866f3', 'db1cf5e7-8464-4d15-81b5-cde8ad0ede7b', 'UZ', 3, '3-ci doza', '3rd dose', 120, '4 aylıq', '4 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('239d55af-0026-4721-bb33-34c26cc55797', 'UZ', 'RV', 'Rotavirus', 'Rotavirus', 'Rotavirus ishalı', 'Rotavirus diarrhea', 'Ağızdan', 'Oral', '#14B8A6', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('2f7aa31e-b427-4bc4-a0b9-cfca0c8f1af4', '239d55af-0026-4721-bb33-34c26cc55797', 'UZ', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a24b3e68-2790-4a1c-946a-bafcc18e6322', '239d55af-0026-4721-bb33-34c26cc55797', 'UZ', 2, '2-ci doza', '2nd dose', 90, '3 aylıq', '3 months', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('20d5e584-a3bf-478c-a734-7a11b80ed318', 'UZ', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3f62d17d-d160-4b18-823e-32ff3ee1a79a', '20d5e584-a3bf-478c-a734-7a11b80ed318', 'UZ', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('acb49698-b1c1-47f4-a82e-e6fa380d1df9', '20d5e584-a3bf-478c-a734-7a11b80ed318', 'UZ', 2, '2-ci doza', '2nd dose', 90, '3 aylıq', '3 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('0cefa3c4-8036-415f-8ebe-788d95f9ad0f', '20d5e584-a3bf-478c-a734-7a11b80ed318', 'UZ', 3, '3-ci doza', '3rd dose', 365, '12 aylıq', '12 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('466421fc-1404-415b-be82-b8a6a0988e49', 'UZ', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 17);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('4ecaa12d-2aca-4121-b914-f0a2b293baa6', '466421fc-1404-415b-be82-b8a6a0988e49', 'UZ', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('0fafad10-1ed2-4a44-907e-a4984ad88c43', '466421fc-1404-415b-be82-b8a6a0988e49', 'UZ', 2, '2-ci doza', '2nd dose', 2190, '6 yaş', '6 years', 11);
COMMIT;