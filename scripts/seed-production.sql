-- Seed script for production database
-- Run: docker exec -it CONTAINER_ID psql $DATABASE_URL -f /app/scripts/seed-production.sql

-- Clear existing data (optional - comment out if you want to keep existing)
TRUNCATE plans, features, feature_groups, options, option_groups, plan_features, plan_option_groups, site_content, menu_links, footer_links, content_blocks, particles_settings CASCADE;

-- Plans
INSERT INTO plans (id, slug, name_lt, tagline_lt, description_lt, base_price_cents, is_highlighted, sort_order) VALUES
(1, 'starter', 'Starter', 'Idealus pradžiai', 'Patikima KNX sistema
Mobili aplikacija patogiam valdymui
Apšvietimo zonų valdymas x12
Judesio ir šviesumo automatika x2
Jungiklių įvestys x7
Drėgmės ir rasos taško matavimas
Jungimo instrukcijos ir dokumentacija
Pilnai paruošta naudojimui', 299900, false, 0),
(2, 'comfort', 'Comfort', 'Populiariausias pasirinkimas', 'KNX valdiklis
Iki 30 apšvietimo taškų
Stiklinis jungiklis
Mobili aplikacija
Žaliuzių valdymas
Klimatizacijos integracija', 625900, true, 1),
(3, 'premium', 'Premium', 'Viskas įskaičiuota', 'KNX valdiklis
Neriboti apšvietimo taškai
Premium jungiklis
Mobili aplikacija
Žaliuzių valdymas
Klimatizacijos integracija
Apsaugos sistema
Multimedia integracija
24/7 palaikymas', 999900, false, 2);

-- Feature Groups
INSERT INTO feature_groups (id, title_lt, sort_order) VALUES
(1, 'Aparatūra', 0),
(2, 'Programa', 1),
(3, 'Palaikymas', 2),
(4, 'Integracija', 1);

-- Features
INSERT INTO features (id, group_id, label_lt, value_type, sort_order) VALUES
(1, 1, 'KNX valdiklis', 'boolean', 0),
(2, 1, 'Apšvietimo taškai', 'text', 1),
(3, 1, 'Jungiklio tipas', 'text', 2),
(4, 1, 'Žaliuzių valdymas', 'boolean', 3),
(5, 2, 'Mobili aplikacija', 'boolean', 0),
(6, 2, 'Balso valdymas', 'boolean', 1),
(7, 2, 'Scenarijai', 'text', 2),
(8, 3, 'Garantija', 'text', 0),
(9, 3, 'Techninė pagalba', 'text', 1),
(10, 3, 'Mokymai', 'boolean', 2);

-- Plan Features
INSERT INTO plan_features (feature_id, plan_id, value_boolean, value_text) VALUES
(1, 1, true, NULL),
(2, 1, NULL, 'Iki 10'),
(3, 1, NULL, 'Paprastas'),
(4, 1, false, NULL),
(5, 1, true, NULL),
(6, 1, false, NULL),
(7, 1, NULL, '5'),
(8, 1, NULL, '2 metai'),
(9, 1, NULL, 'El. paštu'),
(10, 1, false, NULL),
(1, 2, true, NULL),
(2, 2, NULL, 'Iki 30'),
(3, 2, NULL, 'Stiklinis'),
(4, 2, true, NULL),
(5, 2, true, NULL),
(6, 2, true, NULL),
(7, 2, NULL, '20'),
(8, 2, NULL, '5 metai'),
(9, 2, NULL, 'Telefonu'),
(10, 2, false, NULL),
(1, 3, true, NULL),
(2, 3, NULL, 'Neribota'),
(3, 3, NULL, 'Premium'),
(4, 3, true, NULL),
(5, 3, true, NULL),
(6, 3, true, NULL),
(7, 3, NULL, 'Neribota'),
(8, 3, NULL, 'Visą laiką'),
(9, 3, NULL, '24/7'),
(10, 3, true, NULL);

-- Option Groups
INSERT INTO option_groups (id, type_lt, title_lt, description_lt, sort_order) VALUES
(1, 'quantity', 'Apšvietimo taškai', 'Pasirinkite apšvietimo taškų skaičių', 0),
(2, 'switch', 'Panelės tipas', 'Pasirinkite jungiklio dizainą', 1),
(3, 'addon', 'Papildomos funkcijos', 'Išplėskite savo sistemą', 2);

-- Options
INSERT INTO options (id, group_id, label_lt, description_lt, unit_price_cents, min_qty, max_qty, default_qty, is_default, sort_order) VALUES
(1, 1, 'Apšvietimo taškas', 'Vienas LED apšvietimo taškas', 9500, 1, 100, 10, false, 0),
(2, 1, 'Žaliuzių variklis', 'Automatinis žaliuzių valdymas', 15000, 1, 20, 2, false, 1),
(3, 2, 'Paprastas', 'Standartinis plastikinis jungiklis', 1500, 1, 1, 1, true, 0),
(4, 2, 'Stiklinis jutiklinis', 'Elegantiškas stiklinis jungiklis', 8500, 1, 1, 1, false, 1),
(5, 2, 'Premium metalinis', 'Aukščiausios kokybės metalinis jungiklis', 15000, 1, 1, 1, false, 2),
(6, 3, 'Klimato valdymas', 'Šildymo ir vėdinimo integracija', 45000, 1, 1, 1, false, 0),
(7, 3, 'Apsaugos sistema', 'Signalizacija ir jutikliai', 75000, 1, 1, 1, false, 1),
(8, 3, 'Multimedija', 'Garso ir vaizdo sistema', 55000, 1, 1, 1, false, 2);

-- Plan Option Groups (which options are available for which plans)
INSERT INTO plan_option_groups (plan_id, option_group_id) VALUES
(1, 1),
(2, 1),
(2, 2),
(3, 1),
(3, 2),
(3, 3);

-- Site Content
INSERT INTO site_content (id, key, heading_lt, body_lt, cta_label_lt, media_url) VALUES
(1, 'header', 'KNX komplektai', '', 'Pasirinkite', ''),
(2, 'hero', 'Išmanus namas su KNX technologija', 'Automatizuokite savo namus su pasauliniu standartu. Valdykite apšvietimą, šildymą, žaliuzes ir kitus prietaisus iš vienos sistemos.', 'Pasirinkti planą', NULL),
(3, 'contact', 'Susisiekite', 'Kaunas, Lietuva', '', ''),
(4, 'footer', 'KNX Smart Home', 'Profesionalios namų automatizacijos sprendimai su KNX technologija. Sertifikuoti specialistai su ilgamete patirtimi.', '', '');

-- Menu Links
INSERT INTO menu_links (id, label_lt, target_type, target_value, is_active, sort_order) VALUES
(1, 'Funkcijos', 'section', 'features', true, 0),
(2, 'Planai', 'section', 'plans', true, 1),
(3, 'Kontaktai', 'section', 'contact', true, 2);

-- Footer Links
INSERT INTO footer_links (id, label_lt, url, open_in_new_tab, is_active, sort_order) VALUES
(1, 'Privatumo politika', '/privatumo-politika', false, true, 0),
(2, 'Naudojimo sąlygos', '/naudojimo-salygos', false, true, 1);

-- Content Blocks
INSERT INTO content_blocks (id, slug, title_lt, content_lt, is_html, is_active, sort_order) VALUES
(1, 'apie-knx', 'Apie KNX', 'KNX yra pasaulinis standartas namų ir pastatų automatizacijai. Tai atvira sistema, kuri leidžia integruoti skirtingų gamintojų įrangą į vieną valdymo sistemą.', false, true, 0);

-- Particles Settings
INSERT INTO particles_settings (id, enabled, color, quantity, speed, opacity) VALUES
(1, true, '#2d2d39', 50, 20, 20);

-- Reset sequences
SELECT setval('plans_id_seq', (SELECT MAX(id) FROM plans));
SELECT setval('feature_groups_id_seq', (SELECT MAX(id) FROM feature_groups));
SELECT setval('features_id_seq', (SELECT MAX(id) FROM features));
SELECT setval('plan_features_id_seq', (SELECT MAX(id) FROM plan_features));
SELECT setval('option_groups_id_seq', (SELECT MAX(id) FROM option_groups));
SELECT setval('options_id_seq', (SELECT MAX(id) FROM options));
SELECT setval('plan_option_groups_id_seq', (SELECT MAX(id) FROM plan_option_groups));
SELECT setval('site_content_id_seq', (SELECT MAX(id) FROM site_content));
SELECT setval('menu_links_id_seq', (SELECT MAX(id) FROM menu_links));
SELECT setval('footer_links_id_seq', (SELECT MAX(id) FROM footer_links));
SELECT setval('content_blocks_id_seq', (SELECT MAX(id) FROM content_blocks));
SELECT setval('particles_settings_id_seq', (SELECT MAX(id) FROM particles_settings));

SELECT 'Seed completed successfully!' as status;
