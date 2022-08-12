// db.js
import { Pool } from 'pg';
import sql, { SQLStatement } from 'sql-template-strings';

process.env.DB_USER = 'macke';
process.env.DB_PASSWORD = '';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_DATABASE = 'todo';

export const conn = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_DATABASE,
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
