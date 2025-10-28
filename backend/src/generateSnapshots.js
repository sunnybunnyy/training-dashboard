import pg from "pg";
import dayjs from "dayjs";

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function generateSnapshots() {
    const client = await pool.connect();
    try {
        // Get all users
        const users = await client.query("SELECT DISTINCT user_id FROM strava_activities");

        for (const row of users.rows) {
            const userId = row.user_id;

            // Find last activity date for the user
            const lastActivity = await client.query(
                "SELECT MAX(start_date) AS max_date FROM strava_activities WHERE user_id = $1",
                [userId]
            );
            const endDate = dayjs(lastActivity.rows[0].max_date);
            const snapshotDate = endDate.endOf("week");
            
            // Compute window aggregates
            const sevenDaysAgo = snapshotDate.subtract(7, "day").toDate();
            const twentyEightDaysAgo = snapshotDate.subtract(28, "day").toDate();

            const stats7d = await client.query(
                `SELECT
                    SUM(distance) AS weekly_distance_7d,
                    SUM(duration) AS weekly_duration_7d,
                    COUNT(*) AS weekly_runs.
                    COUNT(*) AS weekly_runs,
                    AVG(duration / NULLIF(distance,0)) AS avg_pace_7d,
                    STDDEV(duration / NULLIF(distance,0)) AS pace_std_7d,
                    AVG(avg_hr) AS avg_hr_7d,
                    STDDEV(avg_hr) AS hr_std_7d,
                    MAX(avg_hr) AS max_hr_7d
                FROM strava_activities
                WHERE user_id = $1 AND start_Date >= $2`,
                [userId, sevenDaysAgo]
            );

            const stats28d = await client.query(
                `SELECT
                    AVG(duration / NULLIF(distance,0)) AS avg_pace_28d,,
                    AVG(avg_hr) AS avg_hr_28d,
                    AVG(SUM(distance)) OVER () AS avg_weekly_distance_28d
                FROM strava_activities
                WHERE user_id = $1 AND start_date >= $2`,
                [userId, twentyEightDaysAgo]
            );

            const s7 = stats7d.rows[0];
            const s28 = stats28d.rows[0];
        }
    }
}