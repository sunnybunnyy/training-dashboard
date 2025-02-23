import React, { useState, useEffect, useRef } from 'react';

const ActivityPlannerModal = ({ isOpen, onClose, selectedDate, onSave }) => {
    const [activity, setActivity] = useState({
        type: '',
        distance: '',
        duration: '',
        route: '',
        shoes: ''
    });

    const modalRef = useRef(null); // Ref for the modal container
    const previousFocusRef = useRef(null); // Ref to store the previously focused element

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

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            title: `${activity.type} - ${activity.distance}km`,
            start: selectedDate,
            extendedProps: {
                ...activity,
                planned: true
            }
        });
        onClose();
    };

    // Function to disable arrow keys for number inputs
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
        }
    };

    return (
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
    );
}

export default ActivityPlannerModal;