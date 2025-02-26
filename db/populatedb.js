#! /usr/bin/env node
const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const SQL = `
CREATE TABLE IF NOT EXISTS planned_activities (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title VARCHAR(255),
    date DATE,
    type VARCHAR(50),
    distance INTEGER,
    duration INTEGER,
    route VARCHAR(255),
    shoes VARCHAR(255),
    strava_id BIGINT
);
`;

async function main() {
    console.log('seeding...');
    const client = new Client({
        connectionString: `postgresql://postgres:${process.env.DB_PASSWORD}@localhost:5433/persimmon`
    });
    await client.connect();
    await client.query(SQL);
    await client.end();
    console.log('done');
}

main();

/*
# populating local db 
node db/populatedb.js <local-db-url>

# populating production db
# run it from your machine once after deployment of your app & db
node db/populatedb.js <production-db-url>
*/
