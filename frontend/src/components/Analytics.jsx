import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function Analytics() {
    const [data, setData] = useState([]); // State to hold the fetched data

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/strava/activities`, { credentials: "include" })
            .then(async res => {
            console.log("Response status:", res.status);
            const text = await res.text();
            console.log("Raw response text:", text);
            try {
                return JSON.parse(text);
            } catch (err) {
                console.error("JSON parse error:", err);
                return [];
            }
            })
            .then(json => {
            console.log("Parsed JSON:", json);
            if (!Array.isArray(json)) {
                console.error("Not an array, received:", json);
                setData([]);
                return;
            }
            const transformed = json.map(a => ({
                date: new Date(a.start_date_local).toLocaleDateString(),
                distance: (a.distance / 1000).toFixed(2),
                pace: a.moving_time > 0 ? (a.moving_time / 60) / (a.distance / 1000) : 0,
                avg_hr: a.average_heartrate || 0,
            }));
            setData(transformed.reverse());
            })
            .catch(err => console.error("Fetch failed:", err));
        }, []);


    return (
        <div className='p-4 bg-white rounder-2xl shadow-md'>
            <h2 className="text-xl font-semibold mb-4">Training Trends</h2>
            {data.length === 0 ? (
                <p className="text-gray-500">No activities found or Strava not connected.</p>
            ) : (
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
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