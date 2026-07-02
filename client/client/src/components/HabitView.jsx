import HabitList from './HabitList';
import HabitCalendar from './HabitCalendar';
import DailyModal from './DailyModal';
import { useState } from 'react';
import './HabitView.css';

export default function HabitView() {
  const [modalOpen, setModalOpen] = useState(true);
  return (
    <div>
    {/* Modal for Daily Habits */}
    <div className="habit-modal">
      {modalOpen && <DailyModal onClose={() => setModalOpen(false)} />}
    </div>
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
    </div>
  );
}
