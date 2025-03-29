import '../styles/Login.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const api = axios.create({
                    baseURL: API_BASE_URL,
                    withCredentials: true
                });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post(`${API_BASE_URL}/api/login`, { email, password });

            // Store token in localStorage
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // TODO: Redirect to dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="login-container">
            <div className="logo-container">
                <img src="/images/icon/persimmon.gif" alt="Persimmon Logo" className="logo" />
            </div>
            <h2>Sign in</h2>
            <h3>to continue to Persimmon</h3>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder='Email'
                        required
                    />
                </div>

                <div className="form-group">
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder='Password'
                        required
                    />
                </div>

                <div className="action-container">
                    <div className="create-account">
                        <a href="/register">Create account</a>
                    </div>
                    <button type="submit">Sign in</button>
                </div>
            </form>
        </div>
    );
};

export default Login;