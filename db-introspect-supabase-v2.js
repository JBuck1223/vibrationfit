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

    // Get all tables using raw SQL
    console.log('📊 TABLES IN PUBLIC SCHEMA:');
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name, table_type
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `
    });

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      // Try alternative approach - get tables from pg_tables
      const { data: altTables, error: altError } = await supabase.rpc('exec_sql', {
        query: `
          SELECT tablename as table_name, 'BASE TABLE' as table_type
          FROM pg_tables
          WHERE schemaname = 'public'
          ORDER BY tablename;
        `
      });
      
      if (altError) {
        console.error('Alternative query also failed:', altError);
        return;
      }
      
      console.log('📊 TABLES (via pg_tables):');
      altTables.forEach(table => {
        console.log(`  - ${table.table_name} (${table.table_type})`);
      });
      console.log();
      
      // Get detailed info for each table
      for (const table of altTables) {
        console.log(`\n📋 Table: ${table.table_name}`);
        
        // Get columns
        const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
          query: `
            SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = '${table.table_name}'
            ORDER BY ordinal_position;
          `
        });
        
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
        const { data: pk, error: pkError } = await supabase.rpc('exec_sql', {
          query: `
            SELECT kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_schema = 'public' 
              AND tc.table_name = '${table.table_name}' 
              AND tc.constraint_type = 'PRIMARY KEY'
            ORDER BY kcu.ordinal_position;
          `
        });
        
        if (!pkError && pk && pk.length > 0) {
          const pkColumns = pk.map(row => row.column_name).join(', ');
          console.log(`  Primary Key: ${pkColumns}`);
        }
        
        // Get foreign keys
        const { data: fk, error: fkError } = await supabase.rpc('exec_sql', {
          query: `
            SELECT 
              kcu.column_name,
              ccu.table_schema AS foreign_table_schema,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND tc.table_schema = 'public' 
              AND tc.table_name = '${table.table_name}';
          `
        });
        
        if (!fkError && fk && fk.length > 0) {
          console.log('  Foreign Keys:');
          fk.forEach(fkRow => {
            console.log(`    ${fkRow.column_name} -> ${fkRow.foreign_table_schema}.${fkRow.foreign_table_name}.${fkRow.foreign_column_name}`);
          });
        }
        
        // Get indexes
        const { data: indexes, error: indexesError } = await supabase.rpc('exec_sql', {
          query: `
            SELECT indexname, indexdef
            FROM pg_indexes 
            WHERE schemaname = 'public' AND tablename = '${table.table_name}'
            ORDER BY indexname;
          `
        });
        
        if (!indexesError && indexes && indexes.length > 0) {
          console.log('  Indexes:');
          indexes.forEach(idx => {
            console.log(`    ${idx.indexname}`);
          });
        }
      }
      
      return;
    }

    // Original approach if it worked
    tables.forEach(table => {
      console.log(`  - ${table.table_name} (${table.table_type})`);
    });

  } catch (error) {
    console.error('❌ Database introspection error:', error.message);
  }
}

introspectDatabase();
