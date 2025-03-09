import '../styles/ConnectStrava.css';
import { useState, useEffect } from 'react';
import api from '../utils/api';

function ConnectStrava() {
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user already has Strava connected
        const checkStravaConnection = async () => {
            try {
                const response = await api.get('/api/strava/connection');
                setConnected(response.data.connected);
            } catch (error) {
                console.error('Error checking Strava connection:', error);
            } finally {
                setLoading(false);
            }
        };

        checkStravaConnection();
    }, []);

    const handleConnectStrava = () => {
        // Get token from localStorage
        const token = localStorage.getItem('token');

        // Create URL object for easier manipulation
        const url = new URL('/auth/strava', window.location.origin);

        // Redirect to this URL
        window.location.href = url.toString();
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="connect-strava-container">
            <h2>Strava Connection</h2>

            {connected ? (
                <div>
                    <p>Your account is connected to Strava.</p>
                    <button onClick={handleConnectStrava}>Reconnect Strava</button>
                </div>
            ) : (
                <div>
                    <p>Connect your account to Strava to sync your activities.</p>
                    <button onClick={handleConnectStrava}>Connect with Strava</button>
                </div>
            )}
        </div>
    );
};

export default ConnectStrava;