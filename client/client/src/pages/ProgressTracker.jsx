
import './ProgressTracker.css';
import Navbar from "../components/Navbar.jsx";
import Heatmap from "../components/Heatmap";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import apiClient from "../api/apiClient.jsx";

export default function ProgressTracker() {
    const [data, setData] = useState({});
    const [timeframe, setTimeframe] = useState('year');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiClient.get('/api/calendar-view');
                if (!response.ok) {
                    throw new Error('Failed to fetch habit history');
                }
                const data = await response.json();
                if (!data) {
                    throw new Error('Invalid data format received from API');
                }
                setData(data);
            } catch (error) {
                console.error('Error fetching habit history:', error);
            }
        };
        fetchData();
    }, []);

    return (
        <>
            <Navbar />
            <div className="progress-tracker">
            <div className="progress-tracker-title">
                Progress Tracker
                <select
                    className="timeframe-select"
                    value={timeframe}
                    onChange={e => setTimeframe(e.target.value)}
                >
                    <option value="year">Year</option>
                    <option value="month">Month</option>
                    <option value="week">Week</option>
                </select>
            </div>
            <div className="progress-tracker-body">
                <div className="heatmap-container">
                    <Heatmap timeframe={timeframe} freq="daily" rawData={data} />
                </div>
            </div>
        </div>
        </>
    );

}