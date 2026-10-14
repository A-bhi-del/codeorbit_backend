const DAY_MS = 86400000;

/** "YYYY-MM-DD" (UTC) for today shifted by `offset` days. */
export const dayKey = (offset = 0) => new Date(Date.now() + offset * DAY_MS).toISOString().slice(0, 10);

/** Day number of a "YYYY-MM-DD" key, so consecutive days differ by exactly 1. */
export const dayNum = (key) => Math.floor(Date.parse(`${key}T00:00:00Z`) / DAY_MS);

/** date -> total count, merging duplicate entries for the same day. */
export const activityByDay = (activity) => {
  const map = new Map();
  (activity || []).forEach((a) => {
    if (!a?.date) return;
    const k = String(a.date).slice(0, 10);
    map.set(k, (map.get(k) || 0) + (a.count || 0));
  });
  return map;
};
