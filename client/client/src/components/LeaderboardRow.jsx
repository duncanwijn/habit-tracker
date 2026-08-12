import React, { useState } from 'react';
import { useAuth } from "../context/AuthContext.jsx";
import apiClient from "../api/apiClient.jsx";
import './LeaderboardRow.css';

export default function LeaderboardRow({ user }) {

    const getLeaderboardInfo = async (friend) => {
        try {
            const response = await apiClient.get(`/api/leaderboard/${friend.id}`);
            setLeaderboardInfo(response.data);
        } catch (error) {
            console.error("Error fetching leaderboard info:", error);
        }
    };

    const [leaderboardInfo, setLeaderboardInfo] = useState({ week: [], streak: 0, completed: false });
    useState(() => {
        getLeaderboardInfo(user);
    }, []);

    return (
        <div className="leaderboard-row">
            <span className="leaderboard-avatar">{user.username.charAt(0).toUpperCase()}</span>
            <span className="leaderboard-name">{user.username}</span>
            <span className="leaderboard-completed">{leaderboardInfo.completed ? 'Completed today' : 'Not completed today'}</span>
            <span className="leaderboard-streak">{leaderboardInfo.streak} 🔥</span>
            <span className="leaderboard-week">{leaderboardInfo.week.map((completed, index) => (
                <span key={index} className={completed ? 'completed' : 'not-completed'}></span>
            ))}</span>
        </div>
    );

}