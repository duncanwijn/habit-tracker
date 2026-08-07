import React, { useState } from 'react';
import { useAuth } from "../context/AuthContext.jsx";
import apiClient from "../api/apiClient.jsx";

export default function LeaderboardRow({ user }) {

    const getLeaderboardInfo = async (friend) => {
        try {
            const response = await apiClient.get(`/api/leaderboard/${friend.id}`);
            setLeaderboardInfo(response.data);
        } catch (error) {
            console.error("Error fetching leaderboard info:", error);
        }
    };

    const { leaderboardInfo, setLeaderboardInfo } = useState(getLeaderboardInfo(user));

    return (
        <div className="leaderboard-row">
            <span className="leaderboard-week">{leaderboardInfo.week}</span>
            <span className="leaderboard-name">{user.username}</span>
            <span className="leaderboard-streak">{leaderboardInfo.streak}</span>
            <span className="leaderboard-completed">{leaderboardInfo.completed}</span>
        </div>
    );

}