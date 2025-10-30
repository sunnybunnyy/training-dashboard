/**
 * Calculate plan recommendation based on user stats
 * using rule-based heuristics.
 * @param {Object} features - User features snapshot
 * @param {number} features.acwr - Acute:Chronic Workload ratio
 * @param {number} features.avg_hr_7d - Average heart rate last 7 days
 * @param {number} features.pace_trend - Change in pace over last 4 weeks
 * @param {number} features.resting_hr - User resting heart rate
 * @returns {string} plan category: "Recovery" | "Maintain" | "Increase"
 */
function recommendPlan(features) {
    const { acwr, avg_hr_7d, pace_trend, resting_hr } = features;

    if (acwr >= 1.3 || avg_hr_7d > resting_hr + 10) {
        return "Recovery";
    } else if (acwr <= 0.7 && pace_trend > -0.02) {
        return "Increase";
    } else {
        return "Maintain";
    }
}

module.exports = { recommendPlan };