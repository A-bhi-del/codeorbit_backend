export const updateActivity = (user, count) => {

  const today = new Date().toISOString().slice(0, 10);

  const existing = user.activity.find(
    (a) => a.date === today
  );

  if (existing) {
    existing.count += count;
  } else {
    user.activity.push({
      date: today,
      count
    });
  }

};