import React, { useState } from 'react';

const ActivityPlannerModal = ({ isOpen, onClose, selectedDate, onSave }) => {
    const [activity, setActivity] = useState({
        type: '',
        distance: '',
        duration: '',
        route: '',
        shoes: ''
    });

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
        <div className="modal-overlay">
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