import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axios from 'axios';

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


    return (
        <div className='p-4 bg-white rounder-2xl shadow-md'>
            <h2 className="text-xl font-semibold mb-4">Training Trends</h2>
            {data.length === 0 ? (
                <p className="text-gray-500">No activities found or Strava not connected.</p>
            ) : (
                <div className="h-80 w-full relative" style="height: 100vh">
                    <ResponsiveContainer>
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5}}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" label={{ value: "Pace (min/km)", angle: -90, position: "insideRight" }} />
                            <YAxis yAxisId="right" orientation="right" label={{ value: "HR (bpm)", angle: 90, position: "insideRight" }} />
                            <Tooltip
                                formatter={(value, name) => {
                                    if (name === "pace") return [`${value.toFixed(2)} min/km`, "Pace"];
                                    if (name === "distance") return [`${value} km`, "Distance"];
                                    if (name === "avg_hr") return [`${value} bpm`, "Avg HR"];
                                    return [value, name];
                                }} 
                            />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="pace" stroke="#8884d8" activeDot={{ r: 6 }} />
                            <Line yAxisId="left" type="monotone" dataKey="distance" stroke="#82ca9d" />
                            <Line yAxisId="right" type="monotone" dataKey="avg_hr" stroke="#ff7300" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}