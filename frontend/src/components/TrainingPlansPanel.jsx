import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import TrainingPlansManager from './TrainingPlansManager';
import '../styles/TrainingPlansPanel.css';

function TrainingPlansPanel( {onTrainingPlanUpdated} ) {
    const [trainingPlans, setTrainingPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showManager, setShowManager] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    // Create authenticated API instance
    const api = process.env.NODE_ENV 
    ? axios.create() 
    : axios.create({
        baseURL: process.env.API_BASE_URL || 'http://localhost:5000',
        withCredentials: true
    });
    api.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Fetch training plans
    const fetchTrainingPlans = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/training-plans');
            setTrainingPlans(response.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching training plans:', error);
            setError('Failed to load training plans');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainingPlans();
    }, []);

    // Start editing a plan
    const handleEditPlan = (plan) => {
        setSelectedPlan(plan);
        setShowManager(true);
    };

    const handleAddNew = () => {
        setSelectedPlan(null);
        setShowManager(true);
    };

    const handleCloseManager = () => {
        setShowManager(false);
        setSelectedPlan(null);
        fetchTrainingPlans(); // Refresh the plans list

        // If we have a callback from the parent (Dashboard), call it
        if (onTrainingPlanUpdated) {
            onTrainingPlanUpdated();
        }
    };

    // Delete a plan
    const handleDeletePlan = async (planId, event) => {
        // Stop event propogation to prevent opening the edit dialog
        event.stopPropogation();

        if (window.confirm("Are you sure you want to delete this training plan? Activities associated with this plan will remain but will no longer be color-coded.")) {
            try {
                await api.delete(`/api/training-plans/${planId}`);
                fetchTrainingPlans(); // Refresh the list
            } catch (error) {
                console.error('Error deleting training plan:', error);
                setError('Failed to delete training plan');
            }
        }
    };

    return (
        <div className="training-plans-panel">
            <div className="panel-header">
                <button className="add-plan-btn" onClick={handleAddNew}>
                    <FaPlus /> Create Plan
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="plans-list">
                {isLoading ? (
                    <div className="loading">Loading training plans...</div>
                ) : trainingPlans.length === 0 ? (
                    <div className="no-plans">No training plans yet. Create one to get started.</div>
                ) : (
                    trainingPlans.map(plan => (
                        <div
                            key={plan.id}
                            className="plan-item"
                            style={{ 
                                borderLeft: `4px solid ${plan.color || '#ccc'}`,
                                cursor: 'pointer' // Add cursor pointer to indicate clickability
                            }}
                            onClick={() => handleEditPlan(plan)} // Make entire plan item clickable
                        >
                            <div className="plan-info">
                                <h3>{plan.name}</h3>
                                {plan.description && <p>{plan.description}</p>}
                            </div>
                            <div className="plan-actions">
                                <button
                                    className="delete-btn"
                                    onClick={(e) => handleDeletePlan(plan.id, e)}
                                    aria-label={`Delete ${plan.name}`}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showManager && (
                <TrainingPlansManager
                    isOpen={showManager}
                    onClose={handleCloseManager}
                    onTrainingPlanUpdated={fetchTrainingPlans}
                    selectedPlan={selectedPlan}
                />
            )}
        </div>
    );
}

export default TrainingPlansPanel;