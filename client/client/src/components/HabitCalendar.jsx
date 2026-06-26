import './HabitCalendar.css';

export default function HabitCalendar() {
  // Mock tracking data: 1 represents completed, 0 represents missed
  // In a real app, this data would come from your state history
  const historyData = [
    1, 1, 0, 1, 1, 1, 1,
    1, 0, 0, 1, 0, 1, 1,
    1, 1, 1, 1, 1, 0, 1,
    0, 1, 1, 1, 1, 1, 1
  ];

  // Labels for the columns (Days of the week)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-card">
      <h3>Monthly Consistency</h3>
      
      {/* Weekday headers layout */}
      <div className="weekday-labels">
        {weekDays.map(day => (
          <span key={day}>{day}</span>
        ))}
      </div>

      {/* Grid of tracking blocks */}
      <div className="heatmap-grid">
        {historyData.map((status, index) => (
          <div 
            key={index} 
            className={`grid-square ${status === 1 ? 'completed' : 'missed'}`}
            title={`Day ${index + 1}: ${status === 1 ? 'Completed' : 'Missed'}`}
          />
        ))}
      </div>

      {/* Simple color key legend */}
      <div className="heatmap-legend">
        <span>Less</span>
        <div className="legend-square missed"></div>
        <div className="legend-square completed"></div>
        <span>More</span>
      </div>
    </div>
  );
}
