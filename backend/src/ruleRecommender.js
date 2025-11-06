import { labelSnapshot } from "./labelHeuristics.js";

/**
 * Recommend a training plan category based on recent user stats
 * @param {Object} features - Snapshot metrics for labeling
 * @param {number} features.acwr - Acute:Chronic Workload ratio
 * @param {number} features.avg_hr_7d - Average heart rate last 7 days
 * @param {number} features.resting_hr - User resting heart rate
 * @param {number} features.pace_trend - Change in pace over last 4 weeks
 * @param {number} features.weekly_distance_7d - Weekly distance over last 7 days
 * @param {number} [features.adherence=1.0] - User adherence to training plan
 * @returns {{ planCategory: string, targetWeeklyDistance: number }} - Derived labels
 */
function recommendPlan(features) {
    // Just reuse the labeling heuristic
    return labelSnapshot(features);
}

module.exports = { recommendPlan };