// db.js
import { Pool } from 'pg';
import sql, { SQLStatement } from 'sql-template-strings';

export const conn = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT!) || 5432,
  database: process.env.POSTGRES_DB,
});

export const query = async <Row = any>(statement: string | SQLStatement) => {
  try {
    return (await conn.query(statement)).rows;
  } catch (error: any) {
    throw new Error(`\Db error: ${error.message}`);
  }
};

// Create database if it doesn't exist
// NOTE! Not the ideal place/way of doing this, but works for now
const initDb = async () => {
  console.log('initDb');
  try {
    const result = await query(sql`SELECT count(*) FROM todo`);
  } catch (error) {
    console.log('Initializing database');
    try {
      await query(sql`CREATE TABLE todo (id SERIAL PRIMARY KEY, name TEXT, checked BOOLEAN)`);
      await query(sql`INSERT INTO todo (checked, name) VALUES (TRUE, 'Milk')`);
      await query(sql`INSERT INTO todo (checked, name) VALUES (FALSE, 'Beef')`);
    } catch (createError) {
      console.log('Error initializing database', createError);
    }
  }
};

initDb();
