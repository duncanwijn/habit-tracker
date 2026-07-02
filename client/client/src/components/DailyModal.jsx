import './DailyModal.css';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import apiClient from '../api/apiClient.jsx';

export default function DailyModal({ onClose }) {
    const { user } = useAuth();
      const initialHabits = [
      { id: 1, name: 'Drink 3L Water', streak: 5, completed: true, freq: 'daily' },
      { id: 2, name: 'Read 15 Pages', streak: 12, completed: false, freq: 'daily' },
      { id: 3, name: 'Go for a Run', streak: 0, completed: false, freq: 'daily'},
      ];
    const [habits, setUserHabits] = useState(initialHabits);
     const getUserHabits = async () => {
        try {
            const response = await apiClient.get(`/api/${user.id}/habits/`);
            if (!response.ok) throw new Error('Failed to fetch habits');
            const data = await response.json();

            const habitsWithStreaks = await Promise.all(
                data.habits.map(async (habit) => {
                    try {
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
            console.log('Fetched user habits:', habitsWithStreaks);
        } catch (error) {
            console.error('Error fetching habits:', error);
        }
    }

    useEffect(() => {
            if (user) {
                getUserHabits();
            } else {
                setUserHabits(initialHabits);
            }
        }, [user]);
    
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Make Today Count!</h2>
                <p>"Success is the sum of small efforts, repeated day in and day out." You’re doing great! Here are the core habits we're focusing on today to keep your momentum going. Just take it one step at a time.</p>
                <h2>Today's Habits</h2>
                <div className="habit-list">
                    <ul>
                        {habits.map(habit => (
                            <li key={habit.id}>
                                {habit.name}
                                <span className={habit.completed ? 'completed' : 'not-completed'}>
                                    {habit.completed ? 'Completed' : 'Not Completed'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                <button onClick={onClose}>Close</button>
            </div>
        </div>

    )

}