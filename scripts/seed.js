const { Pool } = require('pg');

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Connecting to database...');
    
    // Plans
    await pool.query(`
      INSERT INTO plans (slug, name_lt, tagline_lt, description_lt, base_price_cents, is_highlighted, sort_order) VALUES
      ('starter', 'Starter', 'Idealus pradžiai', 'Patikima KNX sistema
Mobili aplikacija patogiam valdymui
Apšvietimo zonų valdymas
Pilnai paruošta naudojimui', 299900, false, 0),
      ('comfort', 'Comfort', 'Populiariausias pasirinkimas', 'KNX valdiklis
Iki 30 apšvietimo taškų
Stiklinis jungiklis
Mobili aplikacija
Žaliuzių valdymas', 625900, true, 1),
      ('premium', 'Premium', 'Viskas įskaičiuota', 'KNX valdiklis
Neriboti apšvietimo taškai
Premium jungiklis
Mobili aplikacija
24/7 palaikymas', 999900, false, 2)
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Plans inserted');

    // Menu Links
    await pool.query(`
      INSERT INTO menu_links (label_lt, target_type, target_value, is_active, sort_order) VALUES
      ('Funkcijos', 'section', 'features', true, 0),
      ('Planai', 'section', 'plans', true, 1),
      ('Kontaktai', 'section', 'contact', true, 2)
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Menu links inserted');

    // Site Content
    await pool.query(`
      INSERT INTO site_content (key, heading_lt, body_lt, cta_label_lt) VALUES
      ('hero', 'Išmanus namas su KNX technologija', 'Automatizuokite savo namus su pasauliniu standartu. Valdykite apšvietimą, šildymą, žaliuzes ir kitus prietaisus iš vienos sistemos.', 'Pasirinkti planą'),
      ('footer', 'KNX Smart Home', 'Profesionalios namų automatizacijos sprendimai su KNX technologija.', '')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Site content inserted');

    // Feature Groups
    await pool.query(`
      INSERT INTO feature_groups (title_lt, sort_order) VALUES
      ('Aparatūra', 0),
      ('Programa', 1),
      ('Palaikymas', 2)
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Feature groups inserted');

    // Get feature group IDs
    const groupsResult = await pool.query('SELECT id, title_lt FROM feature_groups ORDER BY sort_order');
    const groups = {};
    groupsResult.rows.forEach(row => {
      if (row.title_lt === 'Aparatūra') groups.hardware = row.id;
      if (row.title_lt === 'Programa') groups.software = row.id;
      if (row.title_lt === 'Palaikymas') groups.support = row.id;
    });

    // Features
    await pool.query(`
      INSERT INTO features (group_id, label_lt, value_type, sort_order) VALUES
      ($1, 'KNX valdiklis', 'boolean', 0),
      ($1, 'Apšvietimo taškai', 'text', 1),
      ($1, 'Žaliuzių valdymas', 'boolean', 2),
      ($2, 'Mobili aplikacija', 'boolean', 0),
      ($2, 'Balso valdymas', 'boolean', 1),
      ($3, 'Garantija', 'text', 0),
      ($3, 'Techninė pagalba', 'text', 1)
      ON CONFLICT DO NOTHING;
    `, [groups.hardware, groups.software, groups.support]);
    console.log('✓ Features inserted');

    // Get plan and feature IDs
    const plansResult = await pool.query('SELECT id, slug FROM plans ORDER BY sort_order');
    const featuresResult = await pool.query('SELECT id, label_lt FROM features');
    
    const planIds = {};
    plansResult.rows.forEach(row => planIds[row.slug] = row.id);
    
    const featureIds = {};
    featuresResult.rows.forEach(row => featureIds[row.label_lt] = row.id);

    // Plan Features
    const planFeatures = [
      // Starter
      [featureIds['KNX valdiklis'], planIds['starter'], true, null],
      [featureIds['Apšvietimo taškai'], planIds['starter'], null, 'Iki 10'],
      [featureIds['Žaliuzių valdymas'], planIds['starter'], false, null],
      [featureIds['Mobili aplikacija'], planIds['starter'], true, null],
      [featureIds['Balso valdymas'], planIds['starter'], false, null],
      [featureIds['Garantija'], planIds['starter'], null, '2 metai'],
      [featureIds['Techninė pagalba'], planIds['starter'], null, 'El. paštu'],
      // Comfort
      [featureIds['KNX valdiklis'], planIds['comfort'], true, null],
      [featureIds['Apšvietimo taškai'], planIds['comfort'], null, 'Iki 30'],
      [featureIds['Žaliuzių valdymas'], planIds['comfort'], true, null],
      [featureIds['Mobili aplikacija'], planIds['comfort'], true, null],
      [featureIds['Balso valdymas'], planIds['comfort'], true, null],
      [featureIds['Garantija'], planIds['comfort'], null, '5 metai'],
      [featureIds['Techninė pagalba'], planIds['comfort'], null, 'Telefonu'],
      // Premium
      [featureIds['KNX valdiklis'], planIds['premium'], true, null],
      [featureIds['Apšvietimo taškai'], planIds['premium'], null, 'Neribota'],
      [featureIds['Žaliuzių valdymas'], planIds['premium'], true, null],
      [featureIds['Mobili aplikacija'], planIds['premium'], true, null],
      [featureIds['Balso valdymas'], planIds['premium'], true, null],
      [featureIds['Garantija'], planIds['premium'], null, 'Visą laiką'],
      [featureIds['Techninė pagalba'], planIds['premium'], null, '24/7'],
    ];

    for (const [featureId, planId, valueBool, valueText] of planFeatures) {
      if (featureId && planId) {
        await pool.query(`
          INSERT INTO plan_features (feature_id, plan_id, value_boolean, value_text)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING;
        `, [featureId, planId, valueBool, valueText]);
      }
    }
    console.log('✓ Plan features inserted');

    // Particles Settings
    await pool.query(`
      INSERT INTO particles_settings (enabled, color, quantity, speed, opacity)
      VALUES (true, '#2d2d39', 50, 20, 20)
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Particles settings inserted');

    console.log('\n========================================');
    console.log('  DATABASE SEEDED SUCCESSFULLY!');
    console.log('========================================');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

seed();
