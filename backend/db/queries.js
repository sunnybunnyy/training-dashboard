import bcrypt from 'bcryptjs';
import pool from './pool.js';

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

async function insertActivity(userId, planId, title, date, type, distance, duration, route, shoes) {
    const { rows } = await pool.query(
        `INSERT INTO planned_activities
        (user_id, plan_id, title, date, type, distance, duration, route, shoes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [userId, planId, title, date, type, distance, duration, route, shoes]);
    return rows[0];
}

// Update an existing activity
async function updateActivity(id, planId, title, date, type, distance, duration, route, shoes) {
    const { rows } = await pool.query(
        `UPDATE planned_activities
        SET title = $1, plan_id = $2, date = $3, type = $4, distance = $5, duration = $6, route = $7, shoes = $8
        WHERE id = $9
        RETURNING *`,
        [title, planId, date, type, distance, duration, route, shoes, id]);

    return rows[0];
}

// Delete an activity
async function deleteActivity(id) {
    await pool.query(
        `DELETE FROM planned_activities
        WHERE id = $1`,
        [id]);
}

async function clearInvalidStravaCredentials(userId) {
    const { rows } = await pool.query(
        `DELETE FROM strava_credentials
        WHERE user_id = $1
        RETURNING *`,
        [userId]);
    return rows[0];
}

// Get all training plans for a user
async function getTrainingPlansByUserId(userId) {
    const { rows } = await pool.query(
        `SELECT * FROM training_plans
        WHERE user_id = $1
        ORDER BY name`,
        [userId]);
    
    return rows;
}

// Get a training plan by ID
async function getTrainingPlanById(id) {
    const { rows } = await pool.query(
        `SELECT *
        FROM training_plans
        WHERE id = $1`,
        [id]);
    return rows[0];
}

// Create a new training plan
async function createTrainingPlan(userId, name, color, description) {
    const { rows } = await pool.query(
        `INSERT INTO training_plans (user_id, name, color, description)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [userId, name, color, description]);
    return rows[0];
}

// Update a training plan
async function updateTrainingPlan(id, name, color, description) {
    const { rows } = await pool.query(
        `UPDATE training_plans
        SET name = $2, color = $3, description = $4
        WHERE id = $1
        RETURNING *`,
        [id, name, color, description]);
    return rows[0];
}

// Delete a training plan
async function deleteTrainingPlan(id) {
    await pool.query(
        `DELETE FROM training_plans 
        WHERE id = $1`,
        [id]);
}

// Fetch Strava activities for a user
async function getStravaActivitiesByUserId(userId) {
    const { rows } = await pool.query(
        `SELECT * FROM strava_activities
        WHERE user_id = $1`,
        [userId]);
    return rows;
}

// Get a specific Strava activity by ID
async function getStravaActivityById(activityId) {
    const { rows } = await pool.query(
        `SELECT * FROM strava_activities
        WHERE id = $1`,
        [activityId]);
    return rows[0];
}

// Get a specific Strava activity by Strava ID (not internal ID)
async function getStravaActivityByStravaId(userId, stravaId) {
    const { rows } = await pool.query(
        `SELECT * FROM strava_activities
        WHERE user_id = $1 AND strava_id = $2`,
        [userId, stravaId]);
    return rows[0];
}

// Update Strava activitiy's associated training plan
async function upsertStravaActivity(userId, stravaId, planId) {
    const { rows } = await pool.query(
        `INSERT INTO strava_activities (user_id, strava_id, plan_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, strava_id)
        DO UPDATE SET plan_id = EXCLUDED.plan_id
        RETURNING *`,
        [userId, stravaId, planId]);
    return rows[0];
}

export {
    createUser,
    getUserByEmail,
    getUserById,
    saveStravaCredentials,
    getStravaCredentials,
    getPlannedActivitiesByUserId,
    getActivityById,
    insertActivity,
    updateActivity,
    deleteActivity,
    clearInvalidStravaCredentials,
    getTrainingPlansByUserId,
    getTrainingPlanById,
    createTrainingPlan,
    updateTrainingPlan,
    deleteTrainingPlan,
    getStravaActivitiesByUserId,
    getStravaActivityById,
    upsertStravaActivity
};