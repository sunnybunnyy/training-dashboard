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

        }
    }
}