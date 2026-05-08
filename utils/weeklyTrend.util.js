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
  // LeetCode's count represents total submissions (not unique problems)
  // We normalize it to show approximate problems solved per day
  if (activity && activity.length > 0) {
    activity.forEach((a) => {
      const activityDate = new Date(a.date);
      activityDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today - activityDate) / (1000 * 60 * 60 * 24));
      
      // Only include last 7 days
      if (diffDays >= 0 && diffDays < 7) {
        const dayIndex = 6 - diffDays;
        if (last7Days[dayIndex]) {
          // Normalize the count: assume average 3-5 submissions per problem
          // This gives a more realistic "problems solved" count
          const estimatedProblems = Math.ceil(a.count / 4);
          // Cap at 15 problems per day as a reasonable maximum
          const problemCount = Math.min(estimatedProblems, 6);
          last7Days[dayIndex].problems += problemCount;
        }
      }
    });
  }

  // Return without the date field (only day and problems)
  return last7Days.map(({ day, problems }) => ({ day, problems }));
};