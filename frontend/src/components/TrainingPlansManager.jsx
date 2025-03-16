import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { FaTimes } from 'react-icons/fa';
import '../styles/TrainingPlansManager.css'

function TrainingPlansManager ({ isOpen, onClose, onTrainingPlanUpdated, selectedPlan }) {
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

    // Initialize form with selectedPlan if provided
    useEffect(() => {
        if (selectedPlan) {
            setFormData({
                name: selectedPlan.name,
                color: selectedPlan.color || '#3788d8',
                description: selectedPlan.description || ''
            });
        } else {
            // Reset form for new plan
            setFormData({
                name: '',
                color: '#3788d8',
                description: ''
            });
        }
    }, [selectedPlan, isOpen]);

    // Fetch training plans when component mounts
    /*useEffect(() => {
        if (isOpen) {
            fetchTrainingPlans();
        }
    }, [isOpen]);*/

    // Fetch training plans
    /*const fetchTrainingPlans = async () => {
        try {
            const response = await api.get('/api/training-plans');
            setTrainingPlans(response.data);
        } catch (error) {
            console.error('Error fetching training plans:', error);
            setError('Failed to fetch training plans');
        }
    };*/

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
            if (selectedPlan) {
                // Update existing plan
                await api.put(`/api/training-plans/${selectedPlan.id}`, formData);
            } else {
                // Create new plan
                await api.post('/api/training-plans', formData);
            }
            // Notify parent component
            if (onTrainingPlanUpdated) {
                onTrainingPlanUpdated();
            }

            // Close the modal
            onClose();
        } catch (error) {
            console.error('Error saving training plan:', error);
            setError('Failed to save training plan');
        }
    };

    // Delete a plan
    /*const handleDeletePlan = async (planId) => {
        if (window.confirm("Are you sure you want to delete this training plan? Activities associated with this plan will remain but will no longer be color-coded.")) {
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
    };*/

    if (!isOpen) {
        return null;
    }

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            contentLabel="Training Plan Manager"
            className="training-plan-modal"
            overlayClassName="training-plan-modal-overlay"
        >
            <div className="modal-header">
                <h2>{selectedPlan ? 'Edit Training Plan' : 'Create New Training Plan'}</h2>
                <button onClick={onClose} className='close-button'>
                    <FaTimes />
                </button>
            </div>

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
                        <div className='color-input-container'>
                            <input 
                                type="color"
                                id="color"
                                name="color"
                                value={formData.color} 
                                onChange={handleInputChange} 
                                className='color-picker'
                            />
                            <input 
                                type="text"
                                value={formData.color} 
                                onChange={handleInputChange} 
                                name="color"
                                placeholder="#RRGGBB"
                                pattern="^#[0-9A-Fa-f]{6}$"
                                className='color-text'
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

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className='cancel-button'>
                            Cancel
                        </button>
                        <button type="submit" className='save-button'>
                            {selectedPlan ? 'Update Plan' : 'Create Plan'}
                        </button>
                    </div>
                </form>
        </Modal>
   );
};

export default TrainingPlansManager;