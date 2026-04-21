import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde el root si no están cargadas
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'dbname',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
