#! /usr/bin/env node
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

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

CREATE TABLE IF NOT EXISTS training_plans (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(20) NOT NULL,
    description TEXT
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
    strava_id BIGINT NOT NULL,
    plan_id INTEGER REFERENCES training_plans(id) ON DELETE SET NULL,
    UNIQUE(user_id, strava_id)
);

CREATE TABLE IF NOT EXISTS training_snapshots (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    weekly_distance_7d FLOAT,
    weekly_duration_7d FLOAT,
    weekly_runs INTEGER,
    avg_pace_7d FLOAT,
    avg_pace_28d FLOAT,
    pace_std_7d FLOAT,
    avg_hr_7d FLOAT,
    hr_std_7d FLOAT,
    max_hr_7d FLOAT,
    training_load_7d FLOAT,
    previous_week_play VARCHAR(50),
    previous_week_adherence FLOAT,
    pace_trend FLOAT,
    acwr FLOAT,
    hr_trend FLOAT,
    plan_category VARCHAR(20),
    target_weekly_distance FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

`;

async function main() {
    console.log('seeding...');
    const connectionString = process.argv[2]; // read CLI argument
    const client = new Client({
        connectionString
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
