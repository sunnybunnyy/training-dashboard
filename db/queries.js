const pool = require('./pool');

async function getAllPlannedActivities() {
    const { rows } = await pool.query('SELECT * FROM planned_activities');
    console.log("Database query result:", rows);
    return rows;
}

async function insertActivity(strava_id, title, date, type, distance, duration, route, shoes) {
    const result = await pool.query(
        `INSERT INTO planned_activities
        (strava_id, title, date, type, distance, duration, route, shoes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [strava_id, title, date, type, distance, duration, route, shoes]);
    return result.rows[0];
}

module.exports = {
    getAllPlannedActivities,
    insertActivity
};