    import "./HabitForm.css"
import { useState } from 'react';
import HabitEdit from './HabitEdit.jsx';
import apiClient from '../api/apiClient.jsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';


export default function HabitForm({ onAdd }) {

    const { user } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [extraDetails, setExtraDetails] = useState({ freq: 'daily' });
    const [showDetails, setShowDetails] = useState(false);

    const createHabit = (habit) => {
            apiClient.post('/api/create/habit', {...habit, userId: user.id })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to create habit');
                    }
                    return response.json();
                })
                .then(data => {
                    const newHabit = { id: data.habitId ?? Date.now(), name: habit.name, streak: 0, completed: false, freq: habit.freq ?? 'daily' };
                    onAdd(prev => [...prev, newHabit]);
                    setName('');
                    setExtraDetails({ freq: 'daily' });
                    console.log(`Habit created successfully with ID ${newHabit.id}.`);
                })
                .catch(error => console.error('Error creating habit:', error));
        };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (!user) {
            navigate('/login');
            return;
        }
        createHabit({ name: name.trim(), streak: 0, completed: false, ...extraDetails });
    };

    return (
    <section className="form-card">
      {showDetails && (
          <div className="habit-edit-overlay" onClick={() => setShowDetails(false)}>
              <div onClick={(e) => e.stopPropagation()}>
                  <HabitEdit
                      habit={{ name, streak: 0, completed: false, ...extraDetails }}
                      onSave={(details) => { setExtraDetails({ freq: details.freq }); setName(details.name); setShowDetails(false); }}
                      onCancel={() => setShowDetails(false)}
                  />
              </div>
          </div>
      )}
      <form className="habit-form habit-row" onSubmit={handleSubmit}>
        {/* Input Wrapper Group */}
        <div className="habit-info" style={{ width: '100%' }}>
            {/* Input replaces the habit name text */}
            <div className="input-group" style={{ flex: 1 }}>
                <input 
                type="text" 
                id="habit-name" 
                placeholder="Add a new habit..." 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
                />
            </div>
            {/* Right Side: Action Button area */}
            <div className="habit-meta">
            <button type="button" className={`info-btn ${!user ? 'disabled' : ''}`} onClick={() => user && setShowDetails(true)}>i</button>
            <button type="submit" className="submit-btn status-checkbox">
                ✓
            </button>
            </div>
        </div>
      </form>
    </section>
    )
}