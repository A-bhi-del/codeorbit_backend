export const calculateWeeklyTrend = (activity) => {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Initialize last 7 days with 0 problems
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dayName = dayNames[date.getDay()];
    last7Days.push({
      day: dayName,
      problems: 0,
      date: date.toISOString().split('T')[0]
    });
  }

  // Fill in actual activity data
  if (activity && activity.length > 0) {
    activity.forEach((a) => {
      const activityDate = new Date(a.date);
      activityDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today - activityDate) / (1000 * 60 * 60 * 24));
      
      // Only include last 7 days
      if (diffDays >= 0 && diffDays < 7) {
        const dayIndex = 6 - diffDays;
        if (last7Days[dayIndex]) {
          last7Days[dayIndex].problems += a.count;
        }
      }
    });
  }

  // Return without the date field (only day and problems)
  return last7Days.map(({ day, problems }) => ({ day, problems }));
};