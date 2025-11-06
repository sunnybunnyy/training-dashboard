/**
 * Derive plan category and target weekly distance from user metrics
 * @param {Object} features - Snapshot metrics for labeling
 * @param {number} features.acwr - Acute:Chronic Workload ratio
 * @param {number} features.avg_hr_7d - Average heart rate last 7 days
 * @param {number} features.resting_hr - User resting heart rate
 * @param {number} features.pace_trend - Change in pace over last 4 weeks
 * @param {number} features.weekly_distance_7d - Weekly distance over last 7 days
 * @param {number} [features.adherence=1.0] - User adherence to training plan
 * @returns {{ planCategory: string, targetWeeklyDistance: number }} - Derived labels
 */
export function labelSnapshot(features) {
    const {
        acwr,
        avg_hr_7d,
        resting_hr = 60,
        pace_trend,
        weekly_distance_7d,
        adherence = 1.0,
    } = features;

    let planCategory, factor;

    // === Core heuristic ===
    if (acwr >= 1.3 || avg_hr_7d > resting_hr * 1.1 || adherence < 0.5) {
        planCategory = "Recovery";
        factor = 0.7;
    } else if (acwr < 0.85 && pace_trend > -0.01 && adherence >= 0.8) {
        planCategory = "Increase";
        // Dynamic factor scaling by how low acwr is
        const intensityFactor = Math.min(1.25, 1.1 + (0.85 - acwr) * 0.5);
        factor = intensityFactor;
    } else {
        planCategory = "Maintain";
        factor = 1.0;
    }

    const targetWeeklyDistance = weekly_distance_7d * factor;
    
    return { planCategory, targetWeeklyDistance };
}