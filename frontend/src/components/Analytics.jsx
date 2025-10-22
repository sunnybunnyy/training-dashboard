import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import '../styles/Analytics.css';

export default function Analytics({ data, onBack}) {
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
        <div className='training-trends-header'>
            <h2 className="training-trends-title">Training Trends</h2>
            <button className="back-button" onClick={onBack}>Calendar</button>
        </div>
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