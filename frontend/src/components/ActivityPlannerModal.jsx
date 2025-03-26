import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import { FaTimes, FaTrash } from 'react-icons/fa';
import '../styles/ActivityPlannerModal.css';
import TrainingPlansManager from './TrainingPlansManager';

// Bind modal to app element for accessibility
Modal.setAppElement('#root');

function ActivityPlannerModal ({ isOpen, onClose, selectedDate, selectedActivity, onSave, onDelete }) {
    const modalRef = useRef(null); // Ref for the modal container
    const previousFocusRef = useRef(null); // Ref to store the previously focused element
    const [trainingPlans, setTrainingPlans] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showTrainingPlansManager, setShowTrainingPlansManager] = useState(false);
    const [activity, setActivity] = useState({
        title: '',
        start: selectedDate,
        extendedProps: {
            planId: '',
            type: '',
            distance: '',
            duration: '',
            route: '',
            shoes: '',
            planned: true
        }
    });

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

    // Fetch training plans
    const fetchTrainingPlans = async () => {
        try {
            const response = await api.get('/api/training-plans');
            setTrainingPlans(response.data);
        } catch (error) {
            console.error('Error fetching training plans:', error);
        }
    };
    
    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'title' || name === 'start') {
            setActivity({ ...activity, [name]: value});
        } else {
            setActivity({
                ...activity,
                extendedProps: {
                    ...activity.extendedProps,
                    [name]: value
                }
            });
        }
    };

    // Handle training plan selection
    const handleSelectTrainingPlan = (plan) => {
        setActivity({
            ...activity,
            extendedProps: {
                ...activity.extendedProps,
                planId: plan ? plan.id : ''
            }
        });
        setShowTrainingPlansManager(false);
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        // Call the save function passed from parent
        onSave(activity);
       // Close the modal
        onClose();
    };

    // Handle deletion
    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this activity?')) {
            onDelete(activity.id);
            onClose();
        }
    };

    // Function to disable arrow keys for number inputs
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
        }
    };

    // Initialize form when modal opens
    useEffect(() => {
        if (isOpen) {
            // Fetch training plans
            fetchTrainingPlans();
        
            // Reset form
            if (selectedActivity) {
                // Editing existing activity
                setActivity(selectedActivity);
                setIsEditMode(true);
            } else if (selectedDate) {
                // Creating new activity
                setActivity({
                    title: '',
                    start: selectedDate,
                    extendedProps: {
                        planId: '',
                        type: '',
                        distance: '',
                        duration: '',
                        route: '',
                        shoes: '',
                        planned: true
                    }
                });
                setIsEditMode(false);
            }
        }
    }, [isOpen, selectedActivity, selectedDate]);

    // Focus on the modal when it opens
    useEffect(() => {
        if (isOpen) {
            // Save the currently focused element
            previousFocusRef.current = document.activeElement;

            // Focus on the modal container
            if (modalRef.current) {
                modalRef.current.focus();
            }
        } else {
            // Restore focus to the previously focused element when the modal closes
            if (previousFocusRef.current) {
                previousFocusRef.current.focus();
            }
        }
    }, [isOpen]);

    // TODO: Figure out if this can be deleted
    // Trap focus inside the modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Tab') {
                if (!modalRef.current) {
                    return;
                }

                // Get all focusable elements inside the modal
                const focusableElements = modalRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                
                if (e.shiftKey) {
                    // Shift + Tab: Move focus to the previous element

                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    // Tab: Move focus to the next element
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    // Get the currently selected training plan
    const selectedPlan = trainingPlans.find(plan => 
        plan.id === (activity.extendedProps.planId ? parseInt(activity.extendedProps.planId, 10) : null));

    if (!isOpen) {
        return null;
    }

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            contentLabel="Activity Planner"
            className="activity-modal"
            overlayClassName="activity-modal-overlay"
        >
            <div className='modal-header'>
                <h2>
                    {!activity.extendedProps.planned
                        ? 'Associate Strava Activity with Training Plan'
                        : (isEditMode ? 'Edit Activity' : 'Plan New Activity')
                    }
                </h2>
                <button onClick={onClose} className='close-button'>
                    <FaTimes />
                </button>
            </div>
        
            <form onSubmit={handleSubmit}>
                {/* For Strava activities, show read-only activity details */}
                {!activity.extendedProps.planned && (
                    <>
                        <div className="form-group">
                            <input 
                                type="text" 
                                value={activity.title}
                                readOnly
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="date"
                                value={activity.start}
                                readOnly 
                            />
                        </div>
                        <div className="form-group">
                            <input 
                                type="text"
                                value={activity.extendedProps.type}
                                readOnly
                            />
                        </div>
                        <div className="form-group">
                            <input 
                                type="text"
                                value={`${(activity.extendedProps.distance / 1000).toFixed(1)} km`} 
                                readOnly
                            />
                        </div>
                        <div className="form-group">
                            <input 
                                type="text"
                                value={`${Math.floor(activity.extendedProps.duration / 60)} mins`}
                                readOnly
                            />
                        </div>
                    </>
                )}

                {activity.extendedProps.planned && (
                    <>
                        <div className="form-group">
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={activity.title}
                                    onChange={handleInputChange}
                                    placeholder='Title'
                                    required
                                />
                        </div>

                        <div className="form-group">
                                <input
                                    type="date"
                                    id="start"
                                    name="start"
                                    value={activity.start}
                                    onChange={handleInputChange}
                                    required
                                />
                        </div>

                        <div className="form-group">
                            <select
                                id="type"
                                name="type"
                                value={activity.extendedProps.type}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select activity type</option>
                                <option value="Run">Run</option>
                                <option value="Bike">Bike</option>
                                <option value="Swim">Swim</option>
                                <option value="Walk">Walk</option>
                                <option value="Hike">Hike</option>
                                <option value="Workout">Workout</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <input
                                id="distance"
                                className='input-with-unit'
                                type="number"
                                name="distance"
                                value={activity.extendedProps.distance}
                                onChange={handleInputChange}
                                placeholder="Distance"
                                onKeyDown={handleKeyDown}
                                required
                            />
                            <span className='unit-label'>km</span>
                        </div>

                        <div className="form-group">
                            <input
                                id="duration"
                                className='input-with-unit'
                                type="number"
                                name="duration"
                                value={activity.extendedProps.duration}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}    
                                placeholder='Duration (mins)'
                            />
                            <span className='unit-label'>mins</span>
                        </div>

                        <div className='form-group'>
                            <input
                                id="route"
                                type="text"
                                name="route"
                                value={activity.extendedProps.route || ''}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder='Route (optional)'
                            />
                        </div>

                        <div className='form-group'>
                            <input
                                id="shoes"
                                type="text"
                                name="shoes"
                                value={activity.extendedProps.shoes || ''}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder='Shoes (optional)'
                            />
                        </div>
                    </>
                )}

                <div className="form-group">
                    <select 
                        name="planId" 
                        id="planId"
                        value={activity.extendedProps.planId}
                        onChange={handleInputChange}
                        style={{ flex: 1 }}
                    >
                        <option value="">Select training plan</option>
                        {trainingPlans.map(plan => (
                            <option value={plan.id} key={plan.id}>
                                {plan.name}
                            </option>
                        ))}
                    </select>
                </div>

                {activity.extendedProps.planId && selectedPlan && (
                    <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        backgroundColor: selectedPlan.color || '#f0f0f0',
                        borderRadius: '4px',
                        color: isLightColor(selectedPlan.color) ? '#000' : '#fff'
                    }}>
                        This activity will appear with this background colour
                    </div>
                )}

                <div className='modal-actions'>
                    {isEditMode && (
                        <button
                            type="button"
                            className="delete-button"
                            onClick={handleDelete}
                        >
                            Delete
                        </button>
                    )}
                    <button type="submit" className='save-button'>
                        {isEditMode ? 'Update' : 'Save'}
                    </button>
                </div>
            </form>
            {showTrainingPlansManager && (
                <TrainingPlansManager
                    isOpen={showTrainingPlansManager}
                    onClose={() => setShowTrainingPlansManager(false)}
                    onTrainingPlanUpdated={fetchTrainingPlans}
                    selectedPlanId={activity.extendedProps.planId}
                    onSelectPlan={handleSelectTrainingPlan}
                />
            )}
        </Modal>
    );
};

// Helper function to determine if a colour is light or dark
function isLightColor(color) {
    if (!color) {
        return true;
    }

    // Convert hex to RGB
    let r, g, b;
    if (color.startsWith('#')) {
        r = parseInt(color.slice(1, 3), 16);
        g = parseInt(color.slice(3, 5), 16);
        b = parseInt(color.slice(5, 7), 16);
    } else {
        return true; // Default to light for non-hex colours
    }

    // Calculate brightness (YIQ formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128; // Above 128 is considered light
}

export default ActivityPlannerModal;