const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function introspectDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Service Role Key');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('✅ Connected to Supabase successfully\n');

    // Get all tables from the public schema
    console.log('📊 TABLES IN PUBLIC SCHEMA:');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }

    tables.forEach(table => {
      console.log(`  - ${table.table_name} (${table.table_type})`);
    });
    console.log();

    // Get detailed information for each table
    console.log('🔍 DETAILED TABLE STRUCTURE:');
    for (const table of tables) {
      if (table.table_type === 'BASE TABLE') {
        console.log(`\n📋 Table: ${table.table_name}`);
        
        // Get columns
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default, character_maximum_length')
          .eq('table_schema', 'public')
          .eq('table_name', table.table_name)
          .order('ordinal_position');

        if (!columnsError && columns) {
          console.log('  Columns:');
          columns.forEach(col => {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
            const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
            console.log(`    ${col.column_name}: ${col.data_type}${maxLength} ${nullable}${defaultVal}`);
          });
        }

        // Get primary keys
        const { data: pk, error: pkError } = await supabase
          .from('information_schema.table_constraints')
          .select(`
            constraint_name,
            key_column_usage!inner(column_name)
          `)
          .eq('table_schema', 'public')
          .eq('table_name', table.table_name)
          .eq('constraint_type', 'PRIMARY KEY');

        if (!pkError && pk && pk.length > 0) {
          const pkColumns = pk.map(constraint => constraint.key_column_usage.column_name).join(', ');
          console.log(`  Primary Key: ${pkColumns}`);
        }

        // Get foreign keys
        const { data: fk, error: fkError } = await supabase
          .from('information_schema.table_constraints')
          .select(`
            constraint_name,
            key_column_usage!inner(column_name),
            constraint_column_usage!inner(table_schema, table_name, column_name)
          `)
          .eq('table_schema', 'public')
          .eq('table_name', table.table_name)
          .eq('constraint_type', 'FOREIGN KEY');

        if (!fkError && fk && fk.length > 0) {
          console.log('  Foreign Keys:');
          fk.forEach(constraint => {
            const fkInfo = constraint.constraint_column_usage;
            console.log(`    ${constraint.key_column_usage.column_name} -> ${fkInfo.table_schema}.${fkInfo.table_name}.${fkInfo.column_name}`);
          });
        }

        // Get indexes
        const { data: indexes, error: indexesError } = await supabase
          .from('pg_indexes')
          .select('indexname, indexdef')
          .eq('schemaname', 'public')
          .eq('tablename', table.table_name)
          .order('indexname');

        if (!indexesError && indexes && indexes.length > 0) {
          console.log('  Indexes:');
          indexes.forEach(idx => {
            console.log(`    ${idx.indexname}`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Database introspection error:', error.message);
  }
}

introspectDatabase();
