const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function introspectDatabase() {
  // Use the first DATABASE_URL which appears to be the real Supabase connection
  const connectionString = 'postgres://postgres:VNDAEVfc4Zu99Qnf@nxjhqibnlbwzzphewncj.supabase.co:5432/postgres';
  
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database successfully\n');

    // List schemas
    console.log('📋 SCHEMAS:');
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name;
    `);
    schemasResult.rows.forEach(row => console.log(`  - ${row.schema_name}`));
    console.log();

    // List tables with basic info
    console.log('📊 TABLES:');
    const tablesResult = await client.query(`
      SELECT 
        t.table_schema,
        t.table_name,
        t.table_type,
        obj_description(c.oid) as table_comment
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY t.table_schema, t.table_name;
    `);
    
    tablesResult.rows.forEach(row => {
      console.log(`  ${row.table_schema}.${row.table_name} (${row.table_type})`);
      if (row.table_comment) console.log(`    Comment: ${row.table_comment}`);
    });
    console.log();

    // Get detailed table information
    console.log('🔍 DETAILED TABLE STRUCTURE:');
    for (const table of tablesResult.rows) {
      if (table.table_type === 'BASE TABLE') {
        console.log(`\n📋 Table: ${table.table_schema}.${table.table_name}`);
        
        // Get columns
        const columnsResult = await client.query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position;
        `, [table.table_schema, table.table_name]);
        
        console.log('  Columns:');
        columnsResult.rows.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
          const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
          console.log(`    ${col.column_name}: ${col.data_type}${maxLength} ${nullable}${defaultVal}`);
        });

        // Get primary keys
        const pkResult = await client.query(`
          SELECT kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_schema = $1 
            AND tc.table_name = $2 
            AND tc.constraint_type = 'PRIMARY KEY'
          ORDER BY kcu.ordinal_position;
        `, [table.table_schema, table.table_name]);
        
        if (pkResult.rows.length > 0) {
          const pkColumns = pkResult.rows.map(row => row.column_name).join(', ');
          console.log(`  Primary Key: ${pkColumns}`);
        }

        // Get foreign keys
        const fkResult = await client.query(`
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
            AND tc.table_schema = $1 
            AND tc.table_name = $2;
        `, [table.table_schema, table.table_name]);
        
        if (fkResult.rows.length > 0) {
          console.log('  Foreign Keys:');
          fkResult.rows.forEach(fk => {
            console.log(`    ${fk.column_name} -> ${fk.foreign_table_schema}.${fk.foreign_table_name}.${fk.foreign_column_name}`);
          });
        }

        // Get indexes
        const indexesResult = await client.query(`
          SELECT 
            indexname,
            indexdef
          FROM pg_indexes 
          WHERE schemaname = $1 AND tablename = $2
          ORDER BY indexname;
        `, [table.table_schema, table.table_name]);
        
        if (indexesResult.rows.length > 0) {
          console.log('  Indexes:');
          indexesResult.rows.forEach(idx => {
            console.log(`    ${idx.indexname}`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    await client.end();
  }
}

introspectDatabase();
