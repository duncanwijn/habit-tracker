import { useEffect, useState } from 'react';
import { fetchDashboardData } from '../api/fetchDashboard.jsx';

export default function Dashboard() {
    const [message, setMessage] = useState('');
    const [secretData, setSecretData] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchDashboardData()
            .then(data => {
                setMessage(data.message);
                setSecretData(data.secretData);
                setUser(data.user);
            })
            .catch(err => console.error('Failed to load dashboard:', err));
    }, []);

    return (
        <div className="dashboard-container">
            <h1>Welcome to Your Dashboard</h1>
            <p>This is where you can manage your habits and track your progress.</p>
            <p>{message}</p>
            <p>{secretData}</p>
            <p>Logged in as: {user?.username}</p>
        </div>
    );
}