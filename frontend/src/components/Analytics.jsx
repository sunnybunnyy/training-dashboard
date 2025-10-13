import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function Analytics() {
    const [data, setData] = useState([]); // State to hold the fetched data

    useEffect(() => {
        fetch("/api/activities")
        .then(res => res.json())
        .then(json => setData(json))
        .catch(err => console.error(err));
    }, []);

    return (
        <div className='p-4 bg-white rounder-2xl shadow-md'>
            <h2 className="text-xl font-semibold mb-4">Training Trends</h2>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" label={{ value: "Pace (min/km)", angle: -90, position: "insideRight" }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: "HR (bpm)", angle: 90, position: "insideRight" }} />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="pace" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line yAxisId="left" type="monotone" dataKey="distance" stroke="#82ca9d" />
                        <Line yAxisId="right" type="monotone" dataKey="avg_hr" stroke="#ff7300" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}