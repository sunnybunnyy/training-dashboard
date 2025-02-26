const pool = require('./pool');

async function getAllPlannedActivities() {
    const { rows } = await pool.query('SELECT * FROM planned_activities');
    return rows;
}

async function insertActivity(strava_id, id, title, date, type, distance, duration, route, shoes) {
    await pool.query(
        `INSERT INTO planned_activities
        (strava_id, id, title, date, type, distance, duration, route, shoes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
        [strava_id, id, title, date, type, distance, duration, route, shoes]);
}

module.exports = {
    getAllPlannedActivities,
    insertActivity
};