const bcrypt = require('bcryptjs');
const pool = require('./pool');
const jwt = require('jsonwebtoken');

// User authentication functions
async function createUser(email, password, firstName, lastName) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await pool.query (
        `INSERT INTO users
        (email, password, first_name, last_name)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, first_name, last_name`, 
        [email, hashedPassword, firstName, lastName]);

    return rows[0];
}

async function getUserByEmail(email) {
    const { rows } = await pool.query(
        `SELECT *
        FROM users
        WHERE email = $1`, 
        [email]);
    return rows;
}

async function getUserById(userId) {
    const { rows } = await pool.query(
        `SELECT id, email, first_name, last_name
        FROM users
        WHERE id = $1`,
        [userId]);
    return rows;
}

// Strava credentials functions
async function saveStravaCredentials(userId, clientId, clientSecret, accessToken, refreshToken, expiresAt) {
    const { rows } = await pool.query(
        `INSERT INTO strava_credentials (user_id, client_id, client_secret, access_token, refresh_token, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id)
        DO UPDATE SET
            client_id = $2,
            client_secret = $3,
            access_token = $4,
            refresh_token = $5,
            expires_at = $6
        RETURNING *`,
        [userId, clientId, clientSecret, accessToken, refreshToken, expiresAt]);
    return rows[0];
}

async function getStravaCredentials(userId) {
    const { rows } = await pool.query(
        `SELECT *
        FROM strava_credentials
        WHERE user_id = $1`,
        [userId]);
    return rows;
}

// Planned activity functions
async function getPlannedActivitiesByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT *
      FROM planned_activities
      WHERE user_id = $1`,
      [userId]);
      
    return rows;
}

// Get an activity by ID
async function getActivityById(id) {
    const { rows } = await pool.query(
        `SELECT *
        FROM planned_activities
        WHERE id = $1`,
        [id]);
    return rows[0];
}

async function insertActivity(userId, title, date, type, distance, duration, route, shoes) {
    const { rows } = await pool.query(
        `INSERT INTO planned_activities
        (user_id, title, date, type, distance, duration, route, shoes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [userId, title, date, type, distance, duration, route, shoes]);
    return rows[0];
}

// Update an existing activity
async function updateActivity(id, title, date, type, distance, duration, route, shoes) {
    const { rows } = await pool.query(
        `UPDATE planned_activities
        SET title = $1, date = $2, type = $3, distance = $4, duration = $5, route = $6, shoes = $7
        WHERE id = $8
        RETURNING *`,
        [title, date, type, distance, duration, route, shoes, id]);

    return rows[0];
}

// Delete an activity
async function deleteActivity(id) {
    const { rows } = await pool.query(
        `DELETE FROM planned_activities
        WHERE id = $1`,
        [id]);
    return rows[0];
}

module.exports = {
    createUser,
    getUserByEmail,
    getUserById,
    saveStravaCredentials,
    getStravaCredentials,
    getPlannedActivitiesByUserId,
    getActivityById,
    insertActivity,
    updateActivity,
    deleteActivity
};