import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import { FaTimes, FaTrash } from 'react-icons/fa';
import '../src/styles/ActivityPlannerModal.css';

// Bind modal to app element for accessibility
Modal.setAppElement('#root');

function ActivityPlannerModal ({ isOpen, onClose, selectedDate, selectedActivity, onSave, onDelete }) {
    const modalRef = useRef(null); // Ref for the modal container
    const previousFocusRef = useRef(null); // Ref to store the previously focused element
    const [isEditMode, setIsEditMode] = useState(false);
    const [activity, setActivity] = useState({
        title: '',
        start: selectedDate,
        extendedProps: {
            type: '',
            distance: '',
            duration: '',
            route: '',
            shoes: '',
            planned: true
        }
    });
    
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

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(activity);
        /* {
            title: `${activity.type} - ${activity.distance}km`,
            start: selectedDate,
            extendedProps: {
                ...activity,
                planned: true
            }
        }*/
        onClose();
    };

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

    // Update form when selectedActivity changes (for editing)
    useEffect(() => {
        if (selectedActivity) {
            setActivity(selectedActivity);
            setIsEditMode(true);
        } else {
            // Reset form for new activites
            setActivity({
                title: '',
                start: selectedDate,
                extendedProps: {
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
    }, [selectedActivity, selectedDate]);

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
                <h2>{isEditMode ? 'Edit Activity' : 'Plan New Activity'}</h2>
                <button onClick={onClose} className='close-button'>
                    <FaTimes />
                </button>
            </div>
        
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                        <label htmlFor="title">Activity Title</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={activity.title}
                            onChange={handleInputChange}
                            placeholder='e.g., Morning Run'
                            required
                        />
                </div>

                <div className="form-group">
                        <label htmlFor="start">Date</label>
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
                    <label htmlFor="type">Activity Type</label>
                    <select
                        id="type"
                        name="type"
                        value={activity.extendedProps.type}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="Run">Run</option>
                        <option value="Ride">Ride</option>
                        <option value="Swim">Swim</option>
                        <option value="Walk">Swim</option>
                        <option value="Hike">Hike</option>
                        <option value="Hike">Workout</option>
                    </select>
                </div>
                
                <div className="form-group">
                    <label htmlFor="distance">Distance (meters)</label>
                    <input
                        id="distance"
                        type="number"
                        name="distance"
                        value={activity.extendedProps.distance}
                        onChange={handleInputChange}
                        placeholder="Distance in meters"
                        onKeyDown={handleKeyDown}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="duration">Duration (minutes)</label>
                    <input
                        id="duration"
                        type="number"
                        name="duration"
                        value={activity.extendedProps.duration}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}    
                />
                </div>

                <div className='form-group'>
                    <label htmlFor="route">Route (optional)</label>
                    <input
                        id="route"
                        type="text"
                        name="route"
                        value={activity.extendedProps.route || ''}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className='form-group'>
                    <label htmlFor="shoes">Shoes (Optional)</label>
                    <input
                        id="shoes"
                        type="text"
                        name="shoes"
                        value={activity.extendedProps.shoes || ''}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className='modal-actions'>
                    {isEditMode && (
                        <button
                            type="button"
                            className="delete-button"
                            onClick={handleDelete}
                        >
                            <FaTrash /> Delete
                        </button>
                    )}
                    <button type="submit" className='save-button'>
                        {isEditMode ? 'Update' : 'Save'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default ActivityPlannerModal;

/*
<div className="modal-overlay" ref={modalRef} tabIndex="=1">
            <div className='modal-content'>
                <h2>Plan Activity for {selectedDate}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="type">Activity Type</label>
                        <select
                            id="type"
                            value={activity.type}
                            onChange={(e) => setActivity({ ...activity, type: e.target.value })}
                            required
                        >
                            <option value="">Select activity type</option>
                            <option value="Run">Run</option>
                            <option value="Ride">Ride</option>
                            <option value="Swim">Swim</option>
                            <option value="Hike">Hike</option>
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="distance">Distance (km)</label>
                        <input
                            id="distance"
                            type="number"
                            step="0.1"
                            value={activity.distance}
                            onChange={(e) => setActivity({ ...activity, distance: e.target.value })}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="duration">Duration (minutes)</label>
                        <input
                            id="duration"
                            type="number"
                            value={activity.duration}
                            onChange={(e) => setActivity({ ...activity, duration: e.target.value })}
                            onKeyDown={handleKeyDown}    
                    />
                    </div>

                    <div className='form-group'>
                        <label htmlFor="route">Route</label>
                        <input
                            id="route"
                            type="text"
                            value={activity.route}
                            onChange={(e) => setActivity({ ...activity, route: e.target.value })}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <div className='form-group'>
                        <label htmlFor="shoes">Shoes</label>
                        <input
                            id="shoes"
                            type="text"
                            value={activity.shoes}
                            onChange={(e) => setActivity({ ...activity, shoes: e.target.value })}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <div className='modal-buttons'>
                        <button type="submit">Save Activity</button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
*/