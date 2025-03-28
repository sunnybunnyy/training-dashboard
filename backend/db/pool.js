const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    database: 'persimmon',
    password: process.env.DB_PASSWORD,
    port: 5433
});

module.exports = pool;