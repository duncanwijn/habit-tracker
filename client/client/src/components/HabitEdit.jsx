import { useState } from 'react';
import './HabitEdit.css';

export default function HabitEdit({ habit, onSave, onCancel }) {
    const [name, setName] = useState(habit.name);
    const [freq, setFreq] = useState(habit.freq ?? 'daily');
    
    const handleSave = () => {
        onSave({ ...habit, name, freq });
    };

    return (
        <div className="habit-edit">
            <h3 className="habit-edit-title">Edit Habit</h3>
            <label className="habit-edit-label">
                Name
                <input
                    className="habit-edit-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Habit Name"
                />
            </label>
            <div className="frequency-options">
                <label className="frequency-option">
                    <input
                        type="radio"
                        name="frequency"
                        value="daily"
                        checked={freq === 'daily'}
                        onChange={() => setFreq('daily')}
                    />
                    Daily
                </label>
                <label className="frequency-option">
                    <input
                        type="radio"
                        name="frequency"
                        value="weekly"
                        checked={freq === 'weekly'}
                        onChange={() => setFreq('weekly')}
                    />
                    Weekly
                </label>
            </div>
            <div className="habit-edit-actions">
                <button className="habit-edit-save" onClick={handleSave}>Save</button>
                <button className="habit-edit-cancel" onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}