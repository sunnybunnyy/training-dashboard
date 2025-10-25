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
            // You need to save strava activity data in 
            // your db, you've got to edit your 
            // strava_activities table and also everywhere 
            // you pull from there probs
        }
    }
}