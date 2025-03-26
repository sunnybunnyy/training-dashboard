#! /usr/bin/env node
const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const SQL = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS strava_credentials (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    client_id VARCHAR(255),
    client_secret VARCHAR(255),
    access_token VARCHAR(255),
    refresh_token VARCHAR(255),
    expires_at TIMESTAMPTZ,
    PRIMARY KEY (user_id)
);

CREATE TABLE IF NOT EXISTS planned_activities (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES training_plans(id) ON DELETE CASCADE,
    title VARCHAR(255),
    date DATE,
    type VARCHAR(50),
    distance INTEGER,
    duration INTEGER,
    route VARCHAR(255),
    shoes VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS strava_activities (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES training_plans(id) ON DELETE CASCADE
)

CREATE TABLE IF NOT EXISTS training_plans (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(20) NOT NULL,
    description TEXT
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
