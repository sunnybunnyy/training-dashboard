import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import '../styles/Analytics.css';

export default function Analytics() {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const api = axios.create({
                      baseURL: API_BASE_URL,
                      withCredentials: true
                  });

    // Add authentication interceptor
    api.interceptors.request.use(
        (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
        },
        (error) => {
        return Promise.reject(error);
        }
    );
    const [data, setData] = useState([]); // State to hold the fetched data

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const res = await api.get('/api/strava/activities');
                const transformed = res.data.map(a => ({
                    date: new Date(a.start_date_local).toLocaleDateString(),
                    distance: (a.distance / 1000).toFixed(2), // Convert to km
                    pace: a.moving_time > 0 ? (a.moving_time / 60) / (a.distance / 1000) : 0, // min/km
                    avg_hr: a.average_heartrate || 0,
            }));
            setData(transformed.reverse()); // Reverse to have oldest first
            } catch (err) {
                console.error("Error fetching activities:", err);
            }
        };
        fetchActivities();
    }, []);


    if (data.length === 0) {
        return (
            <div className="training-trends-container">
            <h2 className="training-trends-title">Training Trends</h2>
            <p className="no-activities-text">No activities found or Strava not connected.</p>
            </div>
        );
    }
    return (
    <div className="training-trends-container">
        { /* Back to Calendar Button */ }
        <button className="back-button" onClick={onBack}>Calendar</button>
        <h2 className="training-trends-title">Training Trends</h2>
        {/* Flex container for 3 charts side-by-side */}
        <div className="charts-wrapper">
        {/* Each chart container */}
            <div className="chart-container">
                <h3 className="chart-title">Pace (min/km)</h3>
                <div className="chart-content">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(v) => [`${v.toFixed(2)} min/km`, "Pace"]} />
                            <Line type="monotone" dataKey="pace" stroke="#8884d8" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="chart-container">
                <h3 className="chart-title">Distance (km)</h3>
                <div className="chart-content">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(v) => [`${v} km`, "Distance"]} />
                            <Line type="monotone" dataKey="distance" stroke="#82ca9d" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="chart-container">
                <h3 className="chart-title">Average Heart Rate (bpm)</h3>
                <div className="chart-content">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(v) => [`${v} bpm`, "Avg HR"]} />
                            <Line type="monotone" dataKey="avg_hr" stroke="#ff7300" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
);
}