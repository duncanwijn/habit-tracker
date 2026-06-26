import HabitList from './HabitList';
import HabitCalendar from './HabitCalendar';
import './HabitView.css';

export default function HabitView() {
  return (
    <div className="habit-view-layout">
      
      {/* Left Column: The Interactive Daily List */}
      <div className="view-column main-list">
        <HabitList />
      </div>

      {/* Right Column: The Visual Consistency Map */}
      <div className="view-column metrics-calendar">
        <HabitCalendar />
      </div>

    </div>
  );
}
