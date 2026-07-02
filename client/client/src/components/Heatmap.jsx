import { useState, useEffect } from "react";
import { HeatMapGrid } from "react-grid-heatmap";
import './Heatmap.css';

// 1. FIXED: Destructured props correctly using object syntax
export default function Heatmap({ timeframe = "year", freq = "daily", rawData = {} }) {

    let xLabels = [];
    let yLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let yLabelsVisibility = new Array(7).fill(0).map((_, i) => (i % 2 === 0 ? "visible" : "hidden"));
    
    // 2. FIXED: Initialized state as a 2D Array instead of an Object
    const [data, setData] = useState([]);
    const [dateMatrix, setDateMatrix] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const matrix = Array.from({ length: 7 }, () => new Array(53).fill(0));
                
                // Safety check for rawData structure
                if (!rawData || !rawData.monthData) {
                    setData(Array.from({ length: 7 }, () => []));
                    return;
                }

                if (timeframe === "year") {
                    const rawKeys = Array.from({ length: 53 }, (_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (52 - i) * 7);
                        return d; 
                    });
                    const dates = Array.from({ length: 7 }, () => new Array(53).fill(''));
                    
                    for (const [index, key] of rawKeys.entries()) {
                        for (const i of [0, 1, 2, 3, 4, 5, 6]) {
                            const date = new Date(key);
                            const currentDayOffset = date.getDay() === 0 ? 6 : date.getDay() - 1; 
                            date.setDate(date.getDate() + (i - currentDayOffset));
                            const dateKey = date.toLocaleDateString('en-CA');

                            matrix[i] = matrix[i] || [];
                            matrix[i][index] = rawData.monthData[dateKey]?.completionRate || 0;
                            dates[i][index] = dateKey;
                        }
                    }
                    setDateMatrix(dates);
                } else if (timeframe === "month") {
                    const startOfMonth = new Date();
                    startOfMonth.setDate(1); 
                    const sundayStart = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth(), startOfMonth.getDate() - startOfMonth.getDay());
                    const saturdayEnd = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0); 
                    saturdayEnd.setDate(saturdayEnd.getDate() + (6 - saturdayEnd.getDay()));
                    const weeksInMonth = Math.ceil((saturdayEnd - sundayStart) / (1000 * 60 * 60 * 24) + 1) / 7;
                    
                    // Adjust matrix rows dynamically for monthly sizing
                    const monthMatrix = Array.from({ length: 7 }, () => new Array(Math.ceil(weeksInMonth)).fill(0));

                    for (let week = 0; week < weeksInMonth; week++) {
                        for (let day = 0; day < 7; day++) {
                            const date = new Date(sundayStart);
                            date.setDate(sundayStart.getDate() + week * 7 + day);
                            const dateKey = date.toLocaleDateString('en-CA');
                            monthMatrix[day][week] = rawData.monthData[dateKey]?.completionRate || 0;
                        }
                    }
                    setDateMatrix(monthMatrix.map((row, day) =>
                        row.map((_, week) => {
                            const date = new Date(sundayStart);
                            date.setDate(sundayStart.getDate() + week * 7 + day);
                            return date.toLocaleDateString('en-CA');
                        })
                    ));
                    setData(monthMatrix);
                    return;
                } else {
                    // Weekly timeframe - 1 row × 7 cols (days as columns)
                    const weekMatrix = [new Array(7).fill(0)];
                    const weekDates = [new Array(7).fill('')];
                    const today = new Date();
                    for (let i = 6; i >= 0; i--) {
                        const date = new Date(today);
                        date.setDate(today.getDate() - i);
                        const dateKey = date.toLocaleDateString('en-CA');
                        weekMatrix[0][6 - i] = rawData.monthData[dateKey]?.completionRate || 0;
                        weekDates[0][6 - i] = dateKey;
                    }
                    setDateMatrix(weekDates);
                    setData(weekMatrix);
                    return;
                }
                setData(matrix);

            } catch (error) {
                console.error('Error fetching habit history:', error);
            }
        };
        fetchData();
    }, [timeframe, freq, rawData]); // Added rawData to dependency array to update grid when data loads

    // --- Label Generation Logical Blocks ---
    if (timeframe == "year") {
        const rawKeys = Array.from({ length: 53 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (52 - i) * 7);
            return d; 
        });

        xLabels = rawKeys.map((currentDate, index) => {
            const monday = new Date(currentDate);
            const dow = monday.getDay();
            monday.setDate(monday.getDate() - (dow === 0 ? 6 : dow - 1));

            if (index === 0) {
                return monday.toLocaleString('en-US', { month: 'short' });
            }

            const prevMonday = new Date(rawKeys[index - 1]);
            const prevDow = prevMonday.getDay();
            prevMonday.setDate(prevMonday.getDate() - (prevDow === 0 ? 6 : prevDow - 1));

            if (monday.getMonth() !== prevMonday.getMonth()) {
                return monday.toLocaleString('en-US', { month: 'short' });
            }
            return '';
        });
    }
    else if (timeframe == "month") {
        const startOfMonth = new Date();
        startOfMonth.setDate(1); 
        const sundayStart = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth(), startOfMonth.getDate() - startOfMonth.getDay());
        const saturdayEnd = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0); 
        saturdayEnd.setDate(saturdayEnd.getDate() + (6 - saturdayEnd.getDay()));
        const weeksInMonth = Math.ceil((saturdayEnd - sundayStart) / (1000 * 60 * 60 * 24) + 1) / 7;
        
        // Match xLabels count exactly with the matrix column length
        xLabels = Array.from({ length: Math.ceil(weeksInMonth) }, (_, i) => `Wk ${i + 1}`);
    } else if (timeframe == "week") {
        const todayForLabels = new Date();
        const dayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        xLabels = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(todayForLabels);
            d.setDate(todayForLabels.getDate() - (6 - i));
            return dayAbbr[d.getDay()];
        });
        yLabels = [''];
        yLabelsVisibility = ['hidden'];
    }

    // 3. FIXED: Guard clause to protect rendering before state array populates
    if (!Array.isArray(data) || data.length === 0 || data[0].length === 0) {
        return <div style={{ color: '#aaa', padding: '20px' }}>Initializing matrix grid...</div>;
    }

    return (
        <div className="heatmap-component">
            <HeatMapGrid
                data={data}
                xLabels={xLabels}
                yLabels={yLabels}
                yLabelsVisibility={yLabelsVisibility}
                cellHeight="2rem"
                cellStyle={(x, y, ratio) => {
                    const cellDate = dateMatrix[x]?.[y];
                    const today = new Date().toLocaleDateString('en-CA');
                    if (cellDate && cellDate > today) {
                        return { background: 'transparent', border: 'none', pointerEvents: 'none' };
                    }
                    return {
                        background: ratio > 0
                            ? `rgba(0, 0, 128, ${0.15 + ratio * 0.85})`
                            : '#e0e0e0',
                        border: '1px solid #808080',
                        fontSize: '9px',
                    };
                }}
                cellRender={(x, y) => (
                    <div
                        title={dateMatrix[x]?.[y] ?? ''}
                        style={{ width: '100%', height: '100%' }}
                    />
                )}
            />
        </div>
    );
}
