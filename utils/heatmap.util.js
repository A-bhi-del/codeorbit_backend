export const generateHeatmapData = (activity) => {

  const map = {};

  activity.forEach((a) => {
    map[a.date] = a.count;
  });

  const result = [];

  const today = new Date();
  const start = new Date();

  start.setDate(today.getDate() - 365);

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {

    const date = d.toISOString().slice(0, 10);

    result.push({
      date,
      count: map[date] || 0
    });

  }

  return result;

};