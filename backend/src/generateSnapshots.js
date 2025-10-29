import dayjs from "dayjs";
import pool from '../db/pool.js';

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
                    COUNT(*) AS weekly_runs,
                    AVG(duration / NULLIF(distance,0)) AS avg_pace_7d,
                    STDDEV(duration / NULLIF(distance,0)) AS pace_std_7d,
                    AVG(avg_hr) AS avg_hr_7d,
                    STDDEV(avg_hr) AS hr_std_7d,
                    MAX(avg_hr) AS max_hr_7d
                FROM strava_activities
                WHERE user_id = $1 AND start_date >= $2`,
                [userId, sevenDaysAgo]
            );

            const stats28d = await client.query(
                `SELECT
                    AVG(duration / NULLIF(distance,0)) AS avg_pace_28d,
                    AVG(avg_hr) AS avg_hr_28d,
                    SUM(distance) / 4.0 AS avg_weekly_distance_28d
                FROM strava_activities
                WHERE user_id = $1 AND start_date >= $2`,
                [userId, twentyEightDaysAgo]
            );

            const s7 = stats7d.rows[0];
            const s28 = stats28d.rows[0];

            // Derived features
            const paceTrend = (s7.avg_pace_7d - s28.avg_pace_28d) / s28.avg_pace_28d;
            const acwr = s7.weekly_distance_7d / (s28.avg_weekly_distance_28d || 1);
            const hrTrend = (s7.avg_hr_7d - s28.avg_hr_28d) / s28.avg_hr_28d;
            const trainingLoad7d = s7.weekly_distance_7d * s7.avg_hr_7d;

            // Label with rule-based heuristic
            let planCategory, targetWeeklyDistance;
            if (acwr >= 1.3 || s7.avg_hr_7d > 180) {
                planCategory = "Recovery";
                targetWeeklyDistance = s7.weekly_distance_7d * 0.7;
            } else if (acwr < 0.85 && paceTrend > -0.03) {
                planCategory = "Increase";
                targetWeeklyDistance = s7.weekly_distance_7d * 1.15;
            } else {
                planCategory = "Maintain";
                targetWeeklyDistance = s7.weekly_distance_7d;
            }

            // Insert into training_snapshots
            await client.query(
                `INSERT INTO training_snapshots
                (user_id, snapshot_date, weekly_distance_7d, 
                weekly_duration_7d, weekly_runs, avg_pace_7d, avg_pace_28d, 
                pace_std_7d, avg_hr_7d, hr_std_7d, max_hr_7d, 
                training_load_7d, pace_trend, acwr, hr_trend, plan_category, 
                target_weekly_distance)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 
                $13, $14, $15, $16, $17)`,
                [
                    userId,
                    snapshotDate.toDate(),
                    s7.weekly_distance_7d,
                    s7.weekly_duration_7d,
                    s7.weekly_runs,
                    s7.avg_pace_7d,
                    s28.avg_pace_28d,
                    s7.pace_std_7d,
                    s7.avg_hr_7d,
                    s7.hr_std_7d,
                    s7.max_hr_7d,
                    trainingLoad7d,
                    paceTrend,
                    acwr,
                    hrTrend,
                    planCategory,
                    targetWeeklyDistance,
                ]
            );

            console.log(`Generated snapshot for user ${userId} on ${snapshotDate.format("YYYY-MM-DD")}`);
        }
    } finally {
        client.release();
    }
}

generateSnapshots()
    .then(() => console.log("Snapshots generation completed"))
    .catch(err => console.error("Error generating snapshots:", err));

// node src/generateSnapshots.js