import './App.css';
import ActivityPlannerModal from './components/ActivityPlannerModal';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from  'react-router-dom';
import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/react'
import interactionPlugin from "@fullcalendar/interaction" // needed for dayClick
import Login from './components/Login';
import PrivateRoute from './utils/PrivateRoute';
import React, { useEffect, useState, useRef } from 'react';
import Register from './components/Register';
import TrainingPlansPanel from './components/TrainingPlansPanel';

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [showTrainingPlans, setShowTrainingPlans] = useState(false); // Start with panel not visible
  const [initialView, setInitialView] = useState({
    currentStart: null,
    currentEnd: null,
    type: 'dayGridMonth'
  });
  const [isLoading, setIsLoading] = useState(true);
  const calendarRef = useRef(null);

  // Use authenticated API calls
  const api = axios.create();

  // Add authentication interceptor
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Fetch Strava activities when the component mounts
  useEffect(() => {
    initialize();
  }, []); // Run only once after the initial render
  
  const initialize = async () => {
    await getLastViewedMonth();
    await fetchActivities();
    disableLogoTabIndex();
    checkStravaConnection();
    setIsLoading(false);
  };

  // Retrieve the last viewed month from localStorage
  const getLastViewedMonth = async () => {
    const savedView = localStorage.getItem('calendarView');
    if (savedView) {
      try {
        const parsedView = JSON.parse(savedView);
        // Use the saved currentStart to set the initial date
        setInitialView(parsedView);
      } catch (error) {
        console.error('Error parsing saved view:', error);
        // Clear invalid localStorage item
        localStorage.removeItem('calendarView');
        // Fall back to current date
        setInitialView({
          currentStart: new Date().toISOString(),
          currentEnd: new Date().toISOString(),
          type: 'dayGridMonth'
        });
      } 
    } else {
      // No saved view, use current date
      setInitialView({
        currentStart: new Date().toISOString(),
        currentEnd: new Date().toISOString(),
        type: 'dayGridMonth'
      });
    }
  };

  // Save calendar view when it changes
  const handleViewChange = (view) => {
    // Extract current month and year
    const currentView = {
      currentStart: view.currentStart.toISOString(),
      currentEnd: view.currentEnd.toISOString(),
      type: view.type
    };
    localStorage.setItem('calendarView', JSON.stringify(currentView));
  };

  // Fetch both Strava and planned activities
  const fetchActivities = async () => {
    try {
      // Fetch Strava activites, planned activities, and training plans
      const [stravaResponse, plannedResponse, trainingPlansResponse] = await Promise.all([
        api.get('/api/strava/activities'),
        api.get('/api/planned-activities'),
        api.get('/api/training-plans')
      ]);

      // Create a map of training plans
      const trainingPlansMap = trainingPlansResponse.data.reduce((acc, plan) => {
        acc[plan.id] = plan;
        return acc;
      }, {});

      // Map Strava activities to FullCalendar events
      const stravaEvents = stravaResponse.data.map(activity => {
        // Find associated training plan if exists
        const associatedPlanId = activity.trainingPlanId
          ? parseInt(activity.trainingPlanId, 10)
          : null;

        const associatedPlan = associatedPlanId
          ? trainingPlansMap[associatedPlanId]
          : null;

        return {
          id: activity.id,
          title: activity.name,
          start: activity.start_date, // FullCalendar will parse this date string
          backgroundColor: associatedPlan ? associatedPlan.color: '',
          extendedProps: {
            type: activity.type,
            distance: activity.distance,
            duration: activity.moving_time,
            planned: false, // Flag to indicate this is a Strava activity
            planId: associatedPlanId,
            planName: associatedPlan ? associatedPlan.name : '',
            trainingPlanId: associatedPlanId
          },
        };
    });

      // Mark planned activities
      const plannedEvents = plannedResponse.data.map(event => ({
        ...event,
        extendedProps: {
          ...event.extendedProps,
          planned: true // Flag to indicate this is a planned activity
        }
      }));

      // Combine both type of events
      setEvents([...stravaEvents, ...plannedEvents]);
    } catch (error) {
      console.error('Error fetching activities:', error);
      // If unauthorized, redirect to login
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
  };

  // Manipulate the logo button after it is rendered
  const disableLogoTabIndex = async () => {
    if (calendarRef.current) {
      // Find the logo button in the DOM
      const calendarEl = calendarRef.current.getApi().el;
      if (calendarEl) {
        const logo = calendarEl.querySelector('.fc-logo-button');
        if (logo) {
          // Set the tabIndex to -1 to make it unfocusable
          logo.tabIndex = -1;
        }
      }
    }
  }

  // Get activity emoji based on type
  const getActivityEmoji = (type) => {
    if (type === 'Run') {
      return '🏃';
    } else if (type === 'Bike') {
      return '🚴';
    } else if (type === 'Swim') {
      return '🏊';
    } else if (type === 'Hike') {
      return '🥾';
    } else if (type === 'Walk') {
      return '🚶';
    } else if (type === 'Workout') {
      return '🏋️';
    }
  };

  const checkStravaConnection = async () => {
    try {
      const response = await api.get('/api/user/strava-status');
      setStravaConnected(response.data.connected);
    } catch (error) {
      console.error('Error checking Strava connection:', error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';    
  };

  const handleConnectStrava = () => {
      // Get token from localStorage
      const token = localStorage.getItem('token');

      // Create URL object for easier manipulation
      const url = new URL('/auth/strava', window.location.origin);

      // Redirect to this URL
      window.location.href = url.toString();
  };

  // Custom buttons for the toolbar
  const customButtons = {
    logo: {
      text: 'Persimmon'
    },
    connectStrava: {
      text: stravaConnected ? 'Strava Connected' : 'Connect Strava',
      click: () => {
        if (!stravaConnected) {
          handleConnectStrava();
        }
      }
    },
    logout: {
      text: 'Logout',
      click: handleLogout
    },
    togglePlans: {
      text: '☰', // Hamburger menu symbol
      click: () => setShowTrainingPlans(!showTrainingPlans)
    }
  };

  // Handle date clicks for creating new activities
  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    setSelectedActivity(null); // Clear any selected activity
    setIsModalOpen(true);
  };

  // Handle event clicks for editing existing activities
  const handleEventClick = (info) => {
    const event = info.event;

    setSelectedActivity({
      id: event.id,
      title: event.title,
      start: event.startStr.split('T')[0], // Get just the date part
      extendedProps: {
        ...event.extendedProps
      }
    });
    setSelectedDate(null); // Clear selected date
    setIsModalOpen(true);
  };

  // Handle saving or updating an activity
  const handleSaveActivity = async (activityData) => {
    try {
      let response;

      if (activityData.extendedProps.planned) {
        if (activityData.id) {
          console.log('Updating activity with ID:', activityData.id, 'Data:', activityData);
          // Update existing activity
          response = await api.put(`/api/planned-activities/${activityData.id}`, activityData);
          console.log('Update response:', response.data);
          // Update the events array
          setEvents(prev => prev.map(event => 
            String(event.id) === String(activityData.id)
            ? {
                ...response.data,
                backgroundColor: response.data.backgroundColor || response.data.extendedProps?.planColour || '',
              }
            : event
          ));
        } else {
          // Create new activity
          response = await api.post('/api/planned-activities', activityData);

          // Add the new activity to events
          setEvents(prev => [...prev, {
            ...response.data,
            backgroundColor: response.data.backgroundColor || response.data.extendedProps?.planColour || '',
            extendedProps: {
              ...response.data.extendedProps,
              planned: true
            }
          }]);
        }
      } else {
        // Handle Strava activity plan association
        try {
          response = await api.put(`/api/strava/activities/${activityData.id}`, {
            trainingPlanId: activityData.extendedProps.planId
          });

          showToast('Activity successfully asociated with training plan');
          // Re-fetch activities to update with new training plan association
          fetchActivities();
        } catch (error) {
          console.error('Error associating activity:', error);
          showToast('Failed to associate activity', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      // If unauthorized, redirect to login
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
  };

  // Handle deleting an activity
  const handleDeleteActivity = async (activityId) => {
    try {
      console.log('Deleting activity with ID:', activityId, 'Type:', typeof activityId);
      await api.delete(`/api/planned-activities/${activityId}`);
      console.log('Current events before deletion:', events);
      // Remove the deleted activity from events
      setEvents(prev => {
        const filtered = prev.filter(event => {
          console.log(`Comparing ${event.id} (${typeof event.id}) with ${activityId} (${typeof activityId}): ${event.id !== activityId}`);
          return String(event.id) !== String(activityId);
      });

      console.log('Events after filtering:', filtered);
      return filtered;
    });
    } catch (error) {
      console.error('Error deleting activity:', error);
      // If unauthorized, redirect to login
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
  };

  // Helper function to determine if a colour is light or dark
  const isLightColor = (color) => {
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
  };

  // Custom event content
  const handleEventContent = (eventInfo) => {
    const title = eventInfo.event.title;
    const isPlanned = eventInfo.event.extendedProps.planned;
    const eventType = eventInfo.event.extendedProps.type || '';
    const distance = eventInfo.event.extendedProps.distance || '';
    const duration = eventInfo.event.extendedProps.duration || '';
    const trainingPlanName = eventInfo.event.extendedProps.planName || '';
    const backgroundColor = eventInfo.event.backgroundColor;
    const shoes = eventInfo.event.extendedProps.shoes || '';
    const route = eventInfo.event.extendedProps.route || '';

    // Format distance (convert to km if needed)
    const formattedDistance = distance ? `${(distance / 1000).toFixed(1)} km` : '';

    // Format duration (convert minutes to hours and minutes)
    let formattedDuration = '';
    if (duration) {
      const hours = Math.floor(duration / 60);
      const minutes = Math.floor((duration % 60));
      formattedDuration = hours > 0 ?
      `${hours}h ${minutes}m` :
      `${minutes}m`;
    }
    
    // Determine text colour based on background colour
    const textColour = backgroundColor ? (isLightColor(backgroundColor) ? '#000' : '#fff') : '#000';

    // Style object with conditional background colour
    const eventStyle = {
      backgroundColor: backgroundColor || '', // Apply the training plan color as background
      color: textColour // Apple appropriate text colour based on background
    };
    
    return (
      <div className={`event-content ${isPlanned ? 'planned-activity' : ''}`} style={eventStyle}>
        <div>{getActivityEmoji(eventType)} {title} {formattedDistance && `- ${formattedDistance}`}</div>
        {(formattedDuration || shoes) && (
          <div>
            {formattedDuration && `⏳ ${formattedDuration}`}
            {shoes && formattedDuration && ' | '}
            {shoes && `👟 ${shoes}`}
          </div>
        )}
        {route && <div>📍 {route}</div>}
        {trainingPlanName && <div>📋 {trainingPlanName}</div>}
      </div>
    );
  };

  const handleTrainingPlanUpdated = () => {
    // Re-fetch all activities to get updated colours
    fetchActivities();
  };

  const handleDayHeader = (arg) => {
    // Get the full weekday name
    const weekdayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(arg.date);
    // Convert to uppercase
    return weekdayName.toUpperCase();
  }

  return (
    <div className={`dashboard-layout ${showTrainingPlans ? 'panel-open' : ''}`}>
      {showTrainingPlans && (
        <div className="sidebar">
          <TrainingPlansPanel 
            onTrainingPlanUpdated={handleTrainingPlanUpdated}
          />
        </div>
      )}

      <div className="calendar-container">
        {!isLoading && (
          <FullCalendar
            ref = {calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView='dayGridMonth'
            initialDate={
              initialView && initialView.currentStart
                ? new Date(initialView.currentStart)
                : new Date() //  Default to current date if no saved view
            }
            headerToolbar={{
              left: 'togglePlans logo today prev next', // Add icon as seperate button
              center: 'title',
              right: 'connectStrava logout' // Connect Strava and Logout buttons on right
            }}
            buttonText={{
              today: 'Today'
            }}
            customButtons={customButtons}
            dayHeaderContent={handleDayHeader}
            weekends={true}
            events={events}
            eventContent={handleEventContent}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            datesSet={(arg) => handleViewChange(arg.view)}
            height="auto"
          />
        )}
        <ActivityPlannerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedDate={selectedDate}
          selectedActivity={selectedActivity}
          onSave={handleSaveActivity}
          onDelete={handleDeleteActivity}
        />
      </div>
    </div>
  );
}

// Main App component with routing
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;