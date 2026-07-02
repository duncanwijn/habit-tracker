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

    const getUserHabits = async () => {
        try {
            const response = await apiClient.get(`/api/${user.id}/habits/`);
            if (!response.ok) throw new Error('Failed to fetch habits');
            const data = await response.json();

            const habitsWithStreaks = await Promise.all(
                data.habits.map(async (habit) => {
                    try {
                        console.log(`Completed status for habit: ${habit.name} is ${habit.completed}`);
                        const streakResponse = await apiClient.get(`/api/habits/${habit.id}/streak`);
                        if (!streakResponse.ok) throw new Error('Failed to fetch habit streak');
                        const streakData = await streakResponse.json();
                        const lastCompletionDate = streakData.lastCompletionDate;
                        const freq = habit.freq ?? 'daily';
                        const shifted = new Date(Date.now() - 4 * 60 * 60 * 1000);
                        const todayStr = shifted.toLocaleDateString('en-CA');
                        let isCompleted = habit.completed ? 1 : 0;
                        if (freq === 'daily' && lastCompletionDate) {
                            if (lastCompletionDate !== todayStr) {
                                isCompleted = 0;
                                apiClient.post(`/api/habits/${habit.id}/uncomplete`).catch(() => {});
                            }
                        } else if (freq === 'weekly' && lastCompletionDate) {
                            const lastDate = new Date(lastCompletionDate + 'T00:00:00');
                            const today = new Date(todayStr + 'T00:00:00');
                            const lastWeek = new Date(today);
                            lastWeek.setDate(today.getDate() - 7);
                            if (lastDate < lastWeek) {
                                isCompleted = 0;
                                apiClient.post(`/api/habits/${habit.id}/uncomplete`).catch(() => {});
                            }
                        }
                        return { ...habit, streak: streakData.streak, completed: isCompleted };
                    } catch (error) {
                        console.error('Error fetching habit streak:', error);
                        return habit;
                    }
                })
            );

            setUserHabits(habitsWithStreaks);
        } catch (error) {
            console.error('Error fetching habits:', error);
        }
    }

    const updateHabit = (habitId, updatedData) => {
        if (!user) {
            console.error('User not authenticated. Cannot update habit.');
            return;
        }
        const { name, freq, icon, amount, type, customUnit } = updatedData;
        apiClient.post(`/api/update/habit/${habitId}`, { name, freq, icon, amount, type, customUnit })
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
    };

    const handleHabitCompletionToggle = (habitId) => {
        const habit = userHabits.find(habit => habit.id === habitId);
        if (!habit) return;
        const newCompleted = habit.completed ? 0 : 1;
        setUserHabits(prevHabits => prevHabits.map(h =>
            h.id === habitId ? { ...h, completed: newCompleted } : h
        ));
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const endpoint = habit.completed ? `/api/habits/${habitId}/uncomplete` : `/api/habits/${habitId}/complete`;
        const body = habit.completed ? {} : { timezone };
        apiClient.post(endpoint, body)
            .then(response => {
                if (!response.ok) throw new Error('Failed to update completion');
                
                if (newCompleted === 1) {
                    apiClient.get(`/api/habits/${habitId}/streak`)
                        .then(r => r.json())
                        .then(streakData => {
                            setUserHabits(prevHabits => prevHabits.map(h =>
                                h.id === habitId ? { ...h, streak: streakData.streak } : h
                            ));
                        })
                        .catch(error => console.error('Error fetching updated streak:', error));
                }
            })
            .catch(error => {
                setUserHabits(prevHabits => prevHabits.map(h =>
                    h.id === habitId ? { ...h, completed: !newCompleted } : h
                ));
                console.error('Error toggling habit completion:', error); });
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
                        {console.log(`Rendering icon for habit: ${habit.name}, Icon: ${habit.icon}`)}
                        {habit.icon && <span className="habit-icon">{habit.icon}</span>}
                        <div className="habit-name-group">
                            <span className="habit-name">{habit.name}</span>
                            {habit.type && habit.type !== 'completion' && (
                                <span className="habit-amount-label">
                                    {habit.amount ?? 1} {habit.type === 'custom' ? (habit.customUnit || 'units') : habit.type === 'count' ? 'rep(s)' : habit.type === 'time' ? 'min' : 'ml'}
                                </span>
                            )}
                        </div>
                        </div>

                        {/* Right side: Streak tracking & Quick Actions */}
                        <div className="habit-meta">
                            {console.log(`Rendering habit: ${habit.name}, Streak: ${habit.streak}`)}
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