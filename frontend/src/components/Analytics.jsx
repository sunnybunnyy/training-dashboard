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
                <div className='flex flex-row justify-between gap-4'>
                    <div className='flex-1 h-[400px]'>
                        <h3 className="text-lg font-medium text-center mb-2">Pace (min/km)</h3>
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

                    <div className='flex-1 h-[400px]'>
                        <h3 className="text-lg font-medium text-center mb-2">Distance km</h3>
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

                    <div className='flex-1 h-[400px]'>
                        <h3 className="text-lg font-medium text-center mb-2">Average Heart Rate (bpm)</h3>
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
            )}
        </div>
    );
}