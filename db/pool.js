const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    database: 'persimmon',
    password: process.env.DB_PASSWORD,
    port: 5433 
});
