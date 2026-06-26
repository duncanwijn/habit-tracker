 import "./HabitList.css"
 import HabitForm from "./HabitForm.jsx"
 import HabitEdit from "./HabitEdit.jsx"
 import { useState, useEffect } from 'react';
 import { useAuth } from '../context/AuthContext.jsx';
 import apiClient from '../api/apiClient.jsx';
 
const initialHabits = [
  { id: 1, name: 'Drink 3L Water', streak: 5, completed: true, freq: 'daily' },
  { id: 2, name: 'Read 15 Pages', streak: 12, completed: false, freq: 'daily' },
  { id: 3, name: 'Go for a Run', streak: 0, completed: false, freq: 'daily'},
];

 export default function HabitList() {
    const { user } = useAuth();
    console.log('[HabitList] rendering, habits:', initialHabits.length);
    const [userHabits, setUserHabits] = useState(initialHabits);
    const [editingHabit, setEditingHabit] = useState(null);

    const deleteHabit = (habitId) => {
        if (!user) {
            console.error('User not authenticated. Cannot delete habit.');
            return;
        }
        apiClient.delete(`/api/habits/${habitId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete habit');
                }
                setUserHabits(prevHabits => prevHabits.filter(habit => habit.id !== habitId));
                console.log(`Habit with ID ${habitId} deleted successfully.`);
            })
            .catch(error => console.error('Error deleting habit:', error));
    };

    const getUserHabits = () => {
        apiClient.get(`/api/${user.id}/habits/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch habits');
                }
                return response.json();
            })
            .then(data => {
                data.habits.map(habit => {
                    apiClient.get(`/api/habits/${habit.id}/streak`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Failed to fetch habit streak');
                            }
                            return response.json();
                        })
                        .then(streakData => {
                            habit.streak = streakData.streak;
                        })
                        .catch(error => console.error('Error fetching habit streak:', error));
                });
                setUserHabits(data.habits);
                console.log('Fetched user habits:', data.habits);
            })
            .catch(error => console.error('Error fetching habits:', error));
    }

    const updateHabit = (habitId, updatedData) => {
        if (!user) {
            console.error('User not authenticated. Cannot update habit.');
            return;
        }
        const { name, freq, userId } = updatedData;
        apiClient.post(`/api/update/habit/${habitId}`, { name, freq, userId })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update habit');
                }
                setUserHabits(prevHabits => prevHabits.map(habit => 
                    habit.id === habitId ? { ...habit, ...updatedData } : habit
                ));
                console.log(`Habit with ID ${habitId} updated successfully.`);
            })
            .catch(error => console.error('Error updating habit:', error));
        if (updatedData.completed) {
            apiClient.post(`/api/habits/${habitId}/complete`).catch(error => console.error('Error updating habit completion status:', error));
        }
    };

    const handleHabitCompletionToggle = (habitId) => {
        const habit = userHabits.find(habit => habit.id === habitId);
        if (habit) {
            updateHabit(habitId, { ...habit, completed: !habit.completed });
        }
    };

    useEffect(() => {
            if (user) {
                getUserHabits();
            } else {
                setUserHabits(initialHabits);
            }
        }, [user]);

    return (
        <div className="habit-list-container">

            {editingHabit && (
                <div className="habit-edit-overlay" onClick={() => setEditingHabit(null)}>
                    <div onClick={(e) => e.stopPropagation()}>
                        <HabitEdit
                            habit={editingHabit}
                            onSave={(updated) => { updateHabit(updated.id, updated); setEditingHabit(null); }}
                            onCancel={() => setEditingHabit(null)}
                        />
                    </div>
                </div>
            )}

            <h3>Your Habits</h3>
                <div className="habit-list">
                    {userHabits.map((habit) => (
                    /* Each individual habit row */
                    <div key={habit.id} className={`habit-row ${habit.completed ? 'completed' : ''}`}>
                        
                        {/* Left side: Status checkbox & Habit details */}
                        <div className="habit-info">
                        <button className={`status-checkbox ${!user ? 'disabled' : ''}`} onClick={() => handleHabitCompletionToggle(habit.id)}>
                            {habit.completed ? '✓' : ''}
                        </button>
                        <span className="habit-name">{habit.name}</span>
                        </div>

                        {/* Right side: Streak tracking & Quick Actions */}
                        <div className="habit-meta">
                            <span className="habit-streak">🔥 {habit.streak}</span>
                            <div className="habit-meta-actions">
                                <button className={`info-btn ${!user ? 'disabled' : ''}`} onClick={() => setEditingHabit(habit)}>i</button>
                                <button className={`delete-btn ${!user ? 'disabled' : ''}`} onClick={() => deleteHabit(habit.id)}>✕</button>
                            </div>
                        </div>
                    </div>
                    ))}
                    <HabitForm onAdd={setUserHabits} />
                </div>
        </div>
    )
}