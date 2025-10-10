import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool(
    isProduction
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false } // Required for Neon's SSL
        }
        : {
            host: 'localhost',
            user: 'postgres',
            database: 'persimmon',
            password: process.env.DB_PASSWORD,
            port: 5433
        }
);

module.exports = pool;