require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const tables = ['users', 'fine_categories', 'traffic_fines', 'payments', 'sms_logs'];

async function checkTables() {
  console.log('Connecting to Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('-------------------------------------------');

  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`FAIL   ${table}: ${error.message}`);
    } else {
      console.log(`OK     ${table} (${count ?? 0} rows)`);
    }
  }

  console.log('-------------------------------------------');
  console.log('Done.');
}

checkTables();
