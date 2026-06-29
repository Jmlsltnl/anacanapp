-- 20260629000000_seed_major_vaccine_countries.sql
-- Seed script for major countries vaccine schedules (TR, US, GB, DE, RU)

BEGIN;

DELETE FROM public.vaccine_countries WHERE code IN ('TR', 'US', 'GB', 'DE', 'RU');

INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('70286079-fd02-430a-8a6b-6287fd6c5f2c', 'TR', 'Türkiyə', 'Turkey', '🇹🇷', 'https://saglik.gov.tr', 'T.C. Sağlık Bakanlığı', 10);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('2e20d1ea-8e2d-41b3-9089-7bcfdc32e7f2', 'TR', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('ae6afb03-f1d0-4c4c-83e3-f6286d8adb31', '2e20d1ea-8e2d-41b3-9089-7bcfdc32e7f2', 'TR', 1, '1-ci doza', '1st dose', 0, 'Doğulanda', 'At birth', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('be8c067d-2348-4d7c-bd54-33d9b2e81fdf', '2e20d1ea-8e2d-41b3-9089-7bcfdc32e7f2', 'TR', 2, '2-ci doza', '2nd dose', 30, '1 aylıq', '1 month', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c507ea2f-4b66-4b39-8851-824643ac754f', '2e20d1ea-8e2d-41b3-9089-7bcfdc32e7f2', 'TR', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('709bf46f-db48-4e51-85c3-159072b9845a', 'TR', 'BCG', 'Vərəm (BCG)', 'Tuberculosis (BCG)', 'Vərəm', 'Tuberculosis', 'Dəridaxili', 'Intradermal', '#10B981', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b8e6f1bb-4d7a-4196-b590-095474de5b1c', '709bf46f-db48-4e51-85c3-159072b9845a', 'TR', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('41ab7d49-19e9-4f0d-aa84-c4288610a604', 'TR', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('ddb26fa3-c3a0-49ea-93a5-322057964a12', '41ab7d49-19e9-4f0d-aa84-c4288610a604', 'TR', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3ccb3e63-a0b7-44c7-b206-135afa0abb4c', '41ab7d49-19e9-4f0d-aa84-c4288610a604', 'TR', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('1f746196-c035-4c53-b700-c1fc717d2624', '41ab7d49-19e9-4f0d-aa84-c4288610a604', 'TR', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a853518f-f75f-4331-a313-29729bb6951b', '41ab7d49-19e9-4f0d-aa84-c4288610a604', 'TR', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('b6923f0a-c535-4d0f-9225-04bd0630a407', 'TR', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('627f9e04-3b4c-478c-82fa-b8c7a2a6a609', 'b6923f0a-c535-4d0f-9225-04bd0630a407', 'TR', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('797524da-495c-4e19-961d-ba31a4de6e03', 'b6923f0a-c535-4d0f-9225-04bd0630a407', 'TR', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('39b89106-2132-4e70-acb9-547d73c06e31', 'b6923f0a-c535-4d0f-9225-04bd0630a407', 'TR', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b2163519-b51d-46f5-9199-d9dde8e2204c', 'b6923f0a-c535-4d0f-9225-04bd0630a407', 'TR', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('be742fc3-654e-4ee7-94f7-55cb495df84c', 'TR', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('edc1ec2a-1721-46e8-b0c2-ad22f20a0f75', 'be742fc3-654e-4ee7-94f7-55cb495df84c', 'TR', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('1083a24a-09e8-4ce4-b7d8-8122d80d4e5f', 'be742fc3-654e-4ee7-94f7-55cb495df84c', 'TR', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('39f34ad2-e54c-435a-be7c-192a00f9044a', 'be742fc3-654e-4ee7-94f7-55cb495df84c', 'TR', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('de4ba884-059c-4bdf-8137-3a8e4bc98bef', 'be742fc3-654e-4ee7-94f7-55cb495df84c', 'TR', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('9516a2c4-07fa-42b0-8e2e-50b2cedc2470', 'TR', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('6ebcfd74-121a-4411-8023-8e5d622d1165', '9516a2c4-07fa-42b0-8e2e-50b2cedc2470', 'TR', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a196a521-92a0-4870-acbf-645b22c0c716', '9516a2c4-07fa-42b0-8e2e-50b2cedc2470', 'TR', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('257b4fa8-792b-426c-ab7a-8be755359dbe', '9516a2c4-07fa-42b0-8e2e-50b2cedc2470', 'TR', 3, '3-ci doza', '3rd dose', 365, '12 aylıq', '12 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('2cbf3c4c-410f-4133-ba28-b5dac0ad3557', 'TR', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('36daeb9b-92bd-428d-878c-1c09dc6e2f99', '2cbf3c4c-410f-4133-ba28-b5dac0ad3557', 'TR', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('cd02b45e-36fa-415e-8f38-1dd753d6c614', '2cbf3c4c-410f-4133-ba28-b5dac0ad3557', 'TR', 2, '2-ci doza', '2nd dose', 1460, '48 aylıq', '48 months', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('779f2651-1d5d-47ff-9630-22ff5a062540', 'TR', 'VAR', 'Su çiçəyi', 'Varicella (Chickenpox)', 'Su çiçəyi', 'Chickenpox', 'Dərialtı', 'Subcutaneous', '#6366F1', true, 17);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('729d59ea-a5da-4926-a157-f8aae38ac202', '779f2651-1d5d-47ff-9630-22ff5a062540', 'TR', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('9f2a8470-b7f1-48af-bbc9-5ca66d79d77b', 'TR', 'HepA', 'Hepatit A', 'Hepatitis A', 'Hepatit A virusu', 'Hepatitis A virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 18);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b898e453-e9c2-44f8-a672-d4f8abe09f70', '9f2a8470-b7f1-48af-bbc9-5ca66d79d77b', 'TR', 1, '1-ci doza', '1st dose', 540, '18 aylıq', '18 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('edc74aac-fef0-4f3f-a87c-c5fe5a17130f', '9f2a8470-b7f1-48af-bbc9-5ca66d79d77b', 'TR', 2, '2-ci doza', '2nd dose', 730, '24 aylıq', '24 months', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('1a38abf3-cc8d-4362-98ba-5c704fe0fc75', 'US', 'ABŞ', 'USA', '🇺🇸', 'https://www.cdc.gov/vaccines/schedules/', 'CDC', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('5ff37a60-19e0-4ec4-832b-0dfaef469c18', 'US', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('eb6df4fa-85d5-464c-bade-165b0684df06', '5ff37a60-19e0-4ec4-832b-0dfaef469c18', 'US', 1, '1-ci doza', '1st dose', 0, 'Doğulanda', 'At birth', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('67ab2480-3a87-44e9-9454-57915fe75cc1', '5ff37a60-19e0-4ec4-832b-0dfaef469c18', 'US', 2, '2-ci doza', '2nd dose', 60, '2 aylıq', '2 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('f2be4b15-c9ad-419f-b800-58a57001732a', '5ff37a60-19e0-4ec4-832b-0dfaef469c18', 'US', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('3c5da099-4b59-4cd7-abc2-7824d7017fe2', 'US', 'RV', 'Rotavirus', 'Rotavirus', 'Rotavirus ishalı', 'Rotavirus diarrhea', 'Ağızdan', 'Oral', '#14B8A6', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('78e53deb-29f9-41c2-8fe7-03318ccfa2bc', '3c5da099-4b59-4cd7-abc2-7824d7017fe2', 'US', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('fe0090f8-3dcd-4661-a074-d94cf6e65fc8', '3c5da099-4b59-4cd7-abc2-7824d7017fe2', 'US', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c64ff54c-c9d9-48e9-ab17-c8a72300bd82', '3c5da099-4b59-4cd7-abc2-7824d7017fe2', 'US', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('009f304b-d925-44e2-9f08-95d143d6b07f', 'US', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('f3f2f9be-b8f2-4ecf-b71d-221137b2c9b0', '009f304b-d925-44e2-9f08-95d143d6b07f', 'US', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('162437f3-e005-4489-aa2c-6a5ffdf4336c', '009f304b-d925-44e2-9f08-95d143d6b07f', 'US', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('81540a37-a6a1-48de-82a2-ea4ddaaa5a90', '009f304b-d925-44e2-9f08-95d143d6b07f', 'US', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('f34199c2-47bf-4912-80da-f40eac8bac29', '009f304b-d925-44e2-9f08-95d143d6b07f', 'US', 4, '4-ci doza', '4th dose', 450, '15 aylıq', '15 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('88e0dc7a-120c-4907-8169-fda095930e6e', 'US', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e1640537-72c9-4909-bba8-f07ef853cd81', '88e0dc7a-120c-4907-8169-fda095930e6e', 'US', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b35c24bd-2014-432d-8353-b70cf8d93fda', '88e0dc7a-120c-4907-8169-fda095930e6e', 'US', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('9c1cca5e-5007-42ce-a2f5-92f8df37d5ac', '88e0dc7a-120c-4907-8169-fda095930e6e', 'US', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('d07218a8-db70-48c9-8fc5-5db50789efe0', '88e0dc7a-120c-4907-8169-fda095930e6e', 'US', 4, '4-ci doza', '4th dose', 365, '12 aylıq', '12 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('3aae7a32-271a-4a60-921b-f957cb324f8e', 'US', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('53a90420-fa08-4488-9c82-a84a2bcc0fce', '3aae7a32-271a-4a60-921b-f957cb324f8e', 'US', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('248ece6d-a635-40d5-8931-7eda5bdc4b46', '3aae7a32-271a-4a60-921b-f957cb324f8e', 'US', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c0e4b116-9877-41c0-b7ca-b46d168b2521', '3aae7a32-271a-4a60-921b-f957cb324f8e', 'US', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('250031fa-9729-47af-9f88-0708ea699524', '3aae7a32-271a-4a60-921b-f957cb324f8e', 'US', 4, '4-ci doza', '4th dose', 365, '12 aylıq', '12 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('e6605e92-f3e8-456e-966d-71546a868ad1', 'US', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('244fdefd-3087-4f4a-b2e2-815ca80d8535', 'e6605e92-f3e8-456e-966d-71546a868ad1', 'US', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('652692eb-58ff-4e60-be17-fc2849e38fa6', 'e6605e92-f3e8-456e-966d-71546a868ad1', 'US', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('8a671f8b-5ad6-470c-ac16-6843436e5666', 'e6605e92-f3e8-456e-966d-71546a868ad1', 'US', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('94b21287-c2ba-45bc-8f75-049c8ffd76c5', 'US', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('f67a4cd6-9899-4791-b166-bd85ea059ab6', '94b21287-c2ba-45bc-8f75-049c8ffd76c5', 'US', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('897d7f6a-63bc-4364-9dcd-61e9d965fca1', '94b21287-c2ba-45bc-8f75-049c8ffd76c5', 'US', 2, '2-ci doza', '2nd dose', 1460, '4-6 yaş', '4-6 years', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('afe70b75-5920-4a48-b3cd-0882fcde7d6e', 'US', 'VAR', 'Su çiçəyi', 'Varicella (Chickenpox)', 'Su çiçəyi', 'Chickenpox', 'Dərialtı', 'Subcutaneous', '#6366F1', true, 17);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('1eb99593-8a00-4cf9-8957-0e69542d1640', 'afe70b75-5920-4a48-b3cd-0882fcde7d6e', 'US', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('bc89d03e-7ecc-4657-82f5-fba6a0eacf80', 'afe70b75-5920-4a48-b3cd-0882fcde7d6e', 'US', 2, '2-ci doza', '2nd dose', 1460, '4-6 yaş', '4-6 years', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('b58ed82d-31f1-47c2-b453-9782ca65edc9', 'GB', 'Böyük Britaniya', 'United Kingdom', '🇬🇧', 'https://www.nhs.uk/conditions/vaccinations/nhs-vaccinations-and-when-to-have-them/', 'NHS', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('d6b5a3b7-7d2f-446a-aba1-e2b6409aa1fc', 'GB', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('1b6a6792-e63c-4939-971c-b9eed35c4eae', 'd6b5a3b7-7d2f-446a-aba1-e2b6409aa1fc', 'GB', 1, '1-ci doza', '1st dose', 60, '8 həftə', '8 weeks', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('399c9ef0-91c1-4d13-a655-d51331db21df', 'd6b5a3b7-7d2f-446a-aba1-e2b6409aa1fc', 'GB', 2, '2-ci doza', '2nd dose', 90, '12 həftə', '12 weeks', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('12d1e5bc-6acd-448d-b170-56ec03ab96c3', 'd6b5a3b7-7d2f-446a-aba1-e2b6409aa1fc', 'GB', 3, '3-ci doza', '3rd dose', 120, '16 həftə', '16 weeks', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a5fc61ba-1e62-4c90-b805-0ceeed4a35f7', 'd6b5a3b7-7d2f-446a-aba1-e2b6409aa1fc', 'GB', 4, '4-ci doza', '4th dose', 1095, '3 yaş 4 ay', '3 years 4 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('ea2cb842-9f63-48b1-9dc4-21f8d7ece641', 'GB', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('9517f5f2-df30-446d-a949-90c05643622f', 'ea2cb842-9f63-48b1-9dc4-21f8d7ece641', 'GB', 1, '1-ci doza', '1st dose', 60, '8 həftə', '8 weeks', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('1eb79f2e-1cbb-4528-b31a-6c76e1affc20', 'ea2cb842-9f63-48b1-9dc4-21f8d7ece641', 'GB', 2, '2-ci doza', '2nd dose', 90, '12 həftə', '12 weeks', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('21ded231-0325-49d1-b218-384bbf87de9e', 'ea2cb842-9f63-48b1-9dc4-21f8d7ece641', 'GB', 3, '3-ci doza', '3rd dose', 120, '16 həftə', '16 weeks', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('73bbe38f-c087-4cb7-a129-189f74e6dcd8', 'ea2cb842-9f63-48b1-9dc4-21f8d7ece641', 'GB', 4, '4-ci doza', '4th dose', 1095, '3 yaş 4 ay', '3 years 4 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('03d113e0-c6e3-44e7-ba3a-32204f6de9fd', 'GB', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('742e751c-d091-41a2-a775-58ac70705e64', '03d113e0-c6e3-44e7-ba3a-32204f6de9fd', 'GB', 1, '1-ci doza', '1st dose', 60, '8 həftə', '8 weeks', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('9ae9f568-be04-4f25-8e25-369a3f008bb9', '03d113e0-c6e3-44e7-ba3a-32204f6de9fd', 'GB', 2, '2-ci doza', '2nd dose', 90, '12 həftə', '12 weeks', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('f1c85ff4-6839-4ee8-a134-6609a30ed4f6', '03d113e0-c6e3-44e7-ba3a-32204f6de9fd', 'GB', 3, '3-ci doza', '3rd dose', 120, '16 həftə', '16 weeks', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('de4c06b3-0199-4851-bbbe-38061c107393', '03d113e0-c6e3-44e7-ba3a-32204f6de9fd', 'GB', 4, '4-ci doza', '4th dose', 365, '1 yaş', '1 year', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('71fe36fc-e7f8-480d-8bc5-849de3a961fe', 'GB', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('ec81190a-680a-4f2f-aa7a-87c04bc8f622', '71fe36fc-e7f8-480d-8bc5-849de3a961fe', 'GB', 1, '1-ci doza', '1st dose', 60, '8 həftə', '8 weeks', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('bef9b5a1-b55c-4ce1-b3be-b642674ff01e', '71fe36fc-e7f8-480d-8bc5-849de3a961fe', 'GB', 2, '2-ci doza', '2nd dose', 90, '12 həftə', '12 weeks', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('16865880-ea07-4c99-9c16-c86c710a2bdd', '71fe36fc-e7f8-480d-8bc5-849de3a961fe', 'GB', 3, '3-ci doza', '3rd dose', 120, '16 həftə', '16 weeks', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('2a0c56a5-c443-4ad3-a50e-24a2c3737d23', 'GB', 'RV', 'Rotavirus', 'Rotavirus', 'Rotavirus ishalı', 'Rotavirus diarrhea', 'Ağızdan', 'Oral', '#14B8A6', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a49a1554-5c63-4e2e-bf64-3c8c3744891f', '2a0c56a5-c443-4ad3-a50e-24a2c3737d23', 'GB', 1, '1-ci doza', '1st dose', 60, '8 həftə', '8 weeks', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b0ab1166-29f8-47b6-8021-89c8b83b0fa5', '2a0c56a5-c443-4ad3-a50e-24a2c3737d23', 'GB', 2, '2-ci doza', '2nd dose', 90, '12 həftə', '12 weeks', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('360dc661-e2a6-4b1c-aa1f-b551674530ad', 'GB', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('0184c588-baad-4dbc-9286-3df117cf1076', '360dc661-e2a6-4b1c-aa1f-b551674530ad', 'GB', 1, '1-ci doza', '1st dose', 90, '12 həftə', '12 weeks', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('ab592f15-ac11-48ba-8349-a4a47290567a', '360dc661-e2a6-4b1c-aa1f-b551674530ad', 'GB', 2, '2-ci doza', '2nd dose', 365, '1 yaş', '1 year', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('f3028d9d-772d-4211-bbc6-ad8d0c6ef21f', 'GB', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c33a1587-37bd-4839-a7cf-c5b985048e17', 'f3028d9d-772d-4211-bbc6-ad8d0c6ef21f', 'GB', 1, '1-ci doza', '1st dose', 365, '1 yaş', '1 year', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('18c66c1e-fbbc-436f-af73-50326c9f8450', 'f3028d9d-772d-4211-bbc6-ad8d0c6ef21f', 'GB', 2, '2-ci doza', '2nd dose', 1095, '3 yaş 4 ay', '3 years 4 months', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('a2b23d2e-5349-4411-a8d4-9bcc9cb51767', 'DE', 'Almaniya', 'Germany', '🇩🇪', 'https://www.rki.de/EN/Content/infections/Vaccination/recomm_STIKO/recomm_STIKO_node.html', 'STIKO (RKI)', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('492a8f0d-01f7-410a-8699-7f800c28a13b', 'DE', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('26ecdfd8-b9fe-407f-a20b-41a7a448769d', '492a8f0d-01f7-410a-8699-7f800c28a13b', 'DE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c596afcd-c7c3-4aa3-a11e-dd08023ca548', '492a8f0d-01f7-410a-8699-7f800c28a13b', 'DE', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('82e2a856-b73b-4293-88e6-f86132f44486', '492a8f0d-01f7-410a-8699-7f800c28a13b', 'DE', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('99275a0b-89e7-4f61-a07b-43c13e0fc861', 'DE', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('342b1758-0d19-4ab5-97cc-74b8b8c5a6aa', '99275a0b-89e7-4f61-a07b-43c13e0fc861', 'DE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('078083cd-fdab-4793-a8fe-5b5942c23663', '99275a0b-89e7-4f61-a07b-43c13e0fc861', 'DE', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('9a54d830-9bed-4909-ac8e-c9bfd2d77d75', '99275a0b-89e7-4f61-a07b-43c13e0fc861', 'DE', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('bb59e497-377e-4535-950e-b31d90853148', 'DE', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('93bfb61e-17b4-4afe-aca9-c6b7b427702c', 'bb59e497-377e-4535-950e-b31d90853148', 'DE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c6169535-6cb7-4796-a620-75cff84bded1', 'bb59e497-377e-4535-950e-b31d90853148', 'DE', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('390b7100-0beb-4e5e-a9f7-c1c3f5875473', 'bb59e497-377e-4535-950e-b31d90853148', 'DE', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('b6a0c3ed-67af-46a2-8466-424e51bf622e', 'DE', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('bc00b7db-58e6-43aa-8bac-e6abcc21db2b', 'b6a0c3ed-67af-46a2-8466-424e51bf622e', 'DE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('9a23913e-629c-42fc-ac80-c98e16ab3e9c', 'b6a0c3ed-67af-46a2-8466-424e51bf622e', 'DE', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c60c94b0-9217-48f7-aee5-9767d52722eb', 'b6a0c3ed-67af-46a2-8466-424e51bf622e', 'DE', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('26965090-7e12-4cd1-bd88-f8cff703dcae', 'DE', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('64996a29-ce37-4336-aff3-92ad6798f987', '26965090-7e12-4cd1-bd88-f8cff703dcae', 'DE', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e0a1d7b0-2198-4032-968e-6ae41e34a5c0', '26965090-7e12-4cd1-bd88-f8cff703dcae', 'DE', 2, '2-ci doza', '2nd dose', 120, '4 aylıq', '4 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('6e47e110-2f2f-4e09-b1eb-7f06e4ad19c0', '26965090-7e12-4cd1-bd88-f8cff703dcae', 'DE', 3, '3-ci doza', '3rd dose', 330, '11 aylıq', '11 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('be9e7c5f-72d5-445c-83d7-182c90b7bea8', 'DE', 'RV', 'Rotavirus', 'Rotavirus', 'Rotavirus ishalı', 'Rotavirus diarrhea', 'Ağızdan', 'Oral', '#14B8A6', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('3537af0a-ba8e-4591-b873-80b0022db624', 'be9e7c5f-72d5-445c-83d7-182c90b7bea8', 'DE', 1, '1-ci doza', '1st dose', 42, '6 həftə', '6 weeks', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('a209567a-903a-47c3-bc89-fe7c62f04d16', 'be9e7c5f-72d5-445c-83d7-182c90b7bea8', 'DE', 2, '2-ci doza', '2nd dose', 60, '2 aylıq', '2 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('7e58a56c-6690-4e6b-b687-39752691cbb1', 'be9e7c5f-72d5-445c-83d7-182c90b7bea8', 'DE', 3, '3-ci doza', '3rd dose', 120, '4 aylıq', '4 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('424c4b9a-70c3-47a3-b01c-81b4622da311', 'DE', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('140d53a3-a8eb-4c4f-ad48-3a2dbdb3719a', '424c4b9a-70c3-47a3-b01c-81b4622da311', 'DE', 1, '1-ci doza', '1st dose', 330, '11 aylıq', '11 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('86d947f0-2bde-4019-9db1-102e7b9b3f33', '424c4b9a-70c3-47a3-b01c-81b4622da311', 'DE', 2, '2-ci doza', '2nd dose', 450, '15 aylıq', '15 months', 11);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('8c447222-5c8b-473e-aef4-dbd5abf72bb5', 'DE', 'VAR', 'Su çiçəyi', 'Varicella (Chickenpox)', 'Su çiçəyi', 'Chickenpox', 'Dərialtı', 'Subcutaneous', '#6366F1', true, 17);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('1db0c807-160d-4a43-8e5a-e16028cb16c0', '8c447222-5c8b-473e-aef4-dbd5abf72bb5', 'DE', 1, '1-ci doza', '1st dose', 330, '11 aylıq', '11 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('0694be5a-aaa8-478c-b706-a61001190598', '8c447222-5c8b-473e-aef4-dbd5abf72bb5', 'DE', 2, '2-ci doza', '2nd dose', 450, '15 aylıq', '15 months', 11);
INSERT INTO public.vaccine_countries (id, code, name_az, name_en, flag_emoji, source_url, source_label, sort_order)
VALUES ('b5d17b4f-5f9d-49f6-a748-9dc987961e1e', 'RU', 'Rusiya', 'Russia', '🇷🇺', 'https://minzdrav.gov.ru/', 'Минздрав РФ', 14);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('05a6477c-099f-4ac8-947a-4fcfd08f3454', 'RU', 'HepB', 'Hepatit B', 'Hepatitis B', 'Hepatit B virusu', 'Hepatitis B virus', 'Əzələdaxili', 'Intramuscular', '#3B82F6', true, 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('71d24975-d0fe-4859-ab30-980d33f78529', '05a6477c-099f-4ac8-947a-4fcfd08f3454', 'RU', 1, '1-ci doza', '1st dose', 0, 'Doğulanda', 'At birth', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('10632675-4bd3-46b4-b730-888a5788c1df', '05a6477c-099f-4ac8-947a-4fcfd08f3454', 'RU', 2, '2-ci doza', '2nd dose', 30, '1 aylıq', '1 month', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('83948504-6b24-47ca-8152-7f53130c783c', '05a6477c-099f-4ac8-947a-4fcfd08f3454', 'RU', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('cdb98e1f-6bf4-42a7-bef5-e370afe353a6', 'RU', 'BCG', 'Vərəm (BCG)', 'Tuberculosis (BCG)', 'Vərəm', 'Tuberculosis', 'Dəridaxili', 'Intradermal', '#10B981', true, 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('58062955-b21f-4286-9648-53d6dc96236e', 'cdb98e1f-6bf4-42a7-bef5-e370afe353a6', 'RU', 1, '1-ci doza', '1st dose', 3, '3-7 gün', '3-7 days', 10);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('d00d1ae7-595e-4575-a82e-158b0642fee4', 'RU', 'PCV', 'Pnevmokokk', 'Pneumococcal', 'Pnevmoniya, meningit', 'Pneumonia, meningitis', 'Əzələdaxili', 'Intramuscular', '#EC4899', true, 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('5450c8d6-327e-4f08-8955-a2012409ab66', 'd00d1ae7-595e-4575-a82e-158b0642fee4', 'RU', 1, '1-ci doza', '1st dose', 60, '2 aylıq', '2 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('69e838b1-0a9d-4354-a7b1-6c719db60664', 'd00d1ae7-595e-4575-a82e-158b0642fee4', 'RU', 2, '2-ci doza', '2nd dose', 135, '4.5 aylıq', '4.5 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e81470b2-5e9d-412f-8a6e-2ca2dfd2a51f', 'd00d1ae7-595e-4575-a82e-158b0642fee4', 'RU', 3, '3-ci doza', '3rd dose', 450, '15 aylıq', '15 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('035ae799-8001-458f-8a4e-d29dbc4fcc16', 'RU', 'DTaP', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Göy öskürək, difteriya, tetanoz', 'Diphtheria, Tetanus, Pertussis', 'Əzələdaxili', 'Intramuscular', '#EF4444', true, 13);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b6ddb103-5057-4cd8-b81c-8a2ef1e998a4', '035ae799-8001-458f-8a4e-d29dbc4fcc16', 'RU', 1, '1-ci doza', '1st dose', 90, '3 aylıq', '3 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e3e1a390-a4a7-491d-9303-7592b0ea3725', '035ae799-8001-458f-8a4e-d29dbc4fcc16', 'RU', 2, '2-ci doza', '2nd dose', 135, '4.5 aylıq', '4.5 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('519afe67-b6c7-433d-8277-6a7bf8845879', '035ae799-8001-458f-8a4e-d29dbc4fcc16', 'RU', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e7b28564-4b12-48cf-a70e-458e156ad514', '035ae799-8001-458f-8a4e-d29dbc4fcc16', 'RU', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('6e85a6af-10fd-42d7-a2da-56730215259a', 'RU', 'IPV', 'Poliomielit (IPV)', 'Polio (IPV)', 'Poliomielit', 'Poliomyelitis', 'Əzələdaxili', 'Intramuscular', '#F59E0B', true, 14);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('f6c39cb2-5966-4a14-b2d7-70dba01b5efc', '6e85a6af-10fd-42d7-a2da-56730215259a', 'RU', 1, '1-ci doza', '1st dose', 90, '3 aylıq', '3 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('e66fab15-693d-444c-a544-53352e7e9def', '6e85a6af-10fd-42d7-a2da-56730215259a', 'RU', 2, '2-ci doza', '2nd dose', 135, '4.5 aylıq', '4.5 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('9f0477ec-3eee-4558-9648-b538b2b027f9', '6e85a6af-10fd-42d7-a2da-56730215259a', 'RU', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('2ec806a0-2a69-4d6b-bc3f-c923de493225', 'RU', 'HiB', 'Hib infeksiyası', 'Haemophilus influenzae type b', 'Meningit, pnevmoniya', 'Meningitis, pneumonia', 'Əzələdaxili', 'Intramuscular', '#8B5CF6', true, 15);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('b5cbc34e-5f47-465b-9a88-e1400f6e6d56', '2ec806a0-2a69-4d6b-bc3f-c923de493225', 'RU', 1, '1-ci doza', '1st dose', 90, '3 aylıq', '3 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('c774d09f-9e5c-4ff4-a0ce-c6d9133ccb7e', '2ec806a0-2a69-4d6b-bc3f-c923de493225', 'RU', 2, '2-ci doza', '2nd dose', 135, '4.5 aylıq', '4.5 months', 11);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('23c5ca90-a28d-4914-b61d-609d5a0fc051', '2ec806a0-2a69-4d6b-bc3f-c923de493225', 'RU', 3, '3-ci doza', '3rd dose', 180, '6 aylıq', '6 months', 12);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('009eb849-0413-4d14-827c-c6b871cd358a', '2ec806a0-2a69-4d6b-bc3f-c923de493225', 'RU', 4, '4-ci doza', '4th dose', 540, '18 aylıq', '18 months', 13);
INSERT INTO public.vaccines (id, country_code, code, name_az, name_en, disease_az, disease_en, route_az, route_en, color_hex, is_mandatory, sort_order)
VALUES ('037b6960-89aa-4bbc-a3ca-1649fef2bd0c', 'RU', 'MMR', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Qızılca, parotit, məxmərək', 'Measles, Mumps, Rubella', 'Dərialtı', 'Subcutaneous', '#F43F5E', true, 16);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('7c58f0a7-028c-4035-a715-eb2750d4035c', '037b6960-89aa-4bbc-a3ca-1649fef2bd0c', 'RU', 1, '1-ci doza', '1st dose', 365, '12 aylıq', '12 months', 10);
INSERT INTO public.vaccine_schedules (id, vaccine_id, country_code, dose_number, dose_label_az, dose_label_en, recommended_age_days, age_label_az, age_label_en, sort_order)
VALUES ('90b37d96-41e1-45df-90b7-221569d0fee3', '037b6960-89aa-4bbc-a3ca-1649fef2bd0c', 'RU', 2, '2-ci doza', '2nd dose', 2190, '6 yaş', '6 years', 11);
COMMIT;