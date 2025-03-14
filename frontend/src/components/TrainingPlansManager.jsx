import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TrainingPlansManager = ({ isOpen, onClose, onTrainingPlanUpdated }) => {
    const [trainingPlans, setTrainingPlans] = useState([]);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        color: '#3788d8', // Default colour
        description: ''
    });
    const [error, setError] = useState('');

    // Create authenticated API instance
    const api = axios.create();
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

    // Fetch training plans when component mounts
    useEffect(() => {
        if (isOpen) {
            fetchTrainingPlans();
        }
    }, [isOpen]);

    // Fetch training plans
    const fetchTrainingPlans = async () => {
        try {
            const response = await api.get('/api/training-plans');
            setTrainingPlans(response.data);
        } catch (error) {
            console.error('Error fetching training plans:', error);
            setError('Failed to fetch training plans');
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Start editing a plan
    const handleEditPlan = (plan) => {
        setEditingPlan(plan.id);
        setFormData({
            name: plan.name,
            color: plan.color,
            description: plan.description || ''
        });
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setEditingPlan(null);
        setFormData({
            name: '',
            color: '#3788d8',
            description: ''
        });
    };

    // Submit form (create or update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (editingPlan) {
                // Update existing plan
                await api.put(`/api/training-plans/${editingPlan}`, formData);
            } else {
                // Create new plan
                await api.post('/api/training-plans', formData);
            }

            // Refresh training plans
            fetchTrainingPlans();

            // Reset form
            setFormData({
                name: '',
                color: '#3788d8',
                description: ''
            });
            setEditingPlan(null);

            // Notify parent component
            if (onTrainingPlanUpdated) {
                onTrainingPlanUpdated();
            }
        } catch (error) {
            console.error('Error saving training plan:', error);
            setError('Failed to save training plan');
        }
    };

    // Delete a plan
    const handleDeletPlan = async (planId) => {
        if (window.confirm(`Are you sure you want to delete this 
            training plan? Activities associated with this plan will 
            remain but will no longer be color-coded.`)) {
            try {
                await api.delete(`/api/training-plans/${planId}`);
                fetchTrainingPlans();

                // Notify parent component
                if (onTrainingPlanUpdated) {
                    onTrainingPlanUpdated();
                }
            } catch (error) {
                console.error('Error deleting training plan:', error);
                setError('Failed to delete training plan');
            }
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className='modal-overlay'>
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <h2>Training Plans</h2>
                {error && <div className="error-message">{error}</div>}

                <form action="" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Plan Name</label>
                        <input 
                            type="text" 
                            id="name" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleInputChange} 
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="color">Color</label>
                        <div style={{ display: 'flex', alignItems: 'center'}}>
                            <input 
                                type="color" 
                                id="color" 
                                name="color" 
                                value={formData.color} 
                                onChange={handleInputChange} 
                                style={{ width: '50px', height: '40px', marginRight: '10px' }} 
                            />
                            <input 
                                type="text"
                                value={formData.color} 
                                onChange={handleInputChange} 
                                name="color"
                                placeholder="#RRGGBB"
                                pattern="^#[0-9A-Fa-f]{6}$"
                                style={{ flex: 1 }} 
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description (optional)</label>
                            <textarea  
                                id="description" 
                                name="description" 
                                value={formData.description} 
                                onChange={handleInputChange} 
                                rows="3"
                        />
                    </div>

                    <div className="modal-buttons">
                        {editingPlan ? (
                            <>
                            <button type="submit">Update Plan</button>
                            <button type="button" onClick={handleCancelEdit}>Cancel</button>
                            </>
                        ) : (
                            <button type="submit">Create Plan</button>
                        )}
                    </div>
                </form>

                <h3 style={{ marginTop: '20px' }}>Your Training Plans</h3>
                {trainingPlans.length === 0 ? (
                    <p>No training plans yet. Create one to get started.</p>
                ) : (
                    <div className="training-plans-list">
                        {trainingPlans.map(plan => (
                            <div className="training-plan-item" key={plan.id} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                padding: '10px', 
                                marginBottom: '10px', 
                                border: '1px solid #ddd', 
                                borderRadius: '4px'
                            }}>
                                <div style={{
                                    width: '20px', 
                                    height: '20px', 
                                    backgroundColor: plan.color, 
                                    borderRadius: '4px', 
                                    marginRight: '10px'
                                }} />
                                <div style={{ flex: 1}}>
                                    <div syle={{ fontWeight: 'bold' }}>{plan.name}</div>
                                    {plan.description && <div style={{ fontSize: '12px' }}>{plan.description}</div>}
                                </div>
                                <div>
                                    <button
                                        onClick={() => handleEditPlan(plan)}
                                        style={{ marginRight: '5px', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDeletePlan(plan.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="modal-buttons" style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button type="button" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default TrainingPlansManager;