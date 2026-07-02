import './HabitCalendar.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import apiClient from '../api/apiClient.jsx';

export default function HabitCalendar() {
  const now = new Date();
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const [historyData, setHistoryData] = useState(Array(daysInCurrentMonth).fill(0));
  const [startDayOfWeek, setStartDayOfWeek] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).getDay()
  );

  useEffect(() => {
    const fetchHabitHistory = async () => {
      try {
        const response = await apiClient.get('/api/calendar-view');
        if (!response.ok) {
          throw new Error('Failed to fetch habit history');
        }
        const data = await response.json();
        if (!data || !data.monthData) {
          throw new Error('Invalid data format received from API');
        }
        const monthData = data.monthData;
        const firstDateKey = Object.keys(monthData)[0];
        if (firstDateKey) {
          const [year, month, day] = firstDateKey.split('-').map(Number);
          setStartDayOfWeek(new Date(year, month - 1, day).getDay());
        }
        const historyArray = Object.values(monthData).map(day => day.completionRate);
        setHistoryData(historyArray);
      } catch (error) {
        console.error('Error fetching habit history:', error);
      }
    };
    fetchHabitHistory();
  }, []);


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
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`spacer-${i}`} className="grid-square spacer" />
        ))}
        {historyData.map((status, index) => (
          <div 
            key={index} 
            className={`grid-square ${status > 0 ? 'completed' : 'missed'}`}
            title={`Day ${index + 1}: ${status > 0 ? 'Completed' : 'Missed'}`}
          >
            <span className="grid-square-label">{index + 1}</span>
          </div>
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
