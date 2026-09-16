import { problemTypes } from "../Components/problems/ProblemSelector";

export function buildDailyTrend(issues, days = 14) {
  const buckets = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets.push({ date: d, key: d.toISOString().slice(0, 10), label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), reports: 0 });
  }
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
  issues.forEach((issue) => {
    if (!issue.created_date) return;
    const key = new Date(issue.created_date).toISOString().slice(0, 10);
    if (byKey[key]) byKey[key].reports += 1;
  });
  return buckets;
}

export function buildResolutionTimeByCategory(issues) {
  const sums = {};
  issues.forEach((issue) => {
    if (issue.status !== "completed" || !issue.resolved_date || !issue.created_date) return;
    const days = (new Date(issue.resolved_date) - new Date(issue.created_date)) / 86400000;
    if (days < 0) return;
    const key = issue.problem_type;
    if (!sums[key]) sums[key] = { total: 0, count: 0 };
    sums[key].total += days;
    sums[key].count += 1;
  });
  return Object.entries(sums)
    .map(([id, { total, count }]) => {
      const meta = problemTypes.find((p) => p.id === id);
      return { label: meta?.label || id, avgDays: Math.round((total / count) * 10) / 10 };
    })
    .sort((a, b) => b.avgDays - a.avgDays);
}
