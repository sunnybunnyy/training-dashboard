import './App.css';
import ActivityPlannerModal from './ActivityPlannerModal';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from  'react-router-dom';
import ConnectStrava from './components/ConnectStrava';
import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/react'
import interactionPlugin from "@fullcalendar/interaction" // needed for dayClick
import Login from './components/Login';
import PrivateRoute from './utils/PrivateRoute';
import React, { useEffect, useState, useRef } from 'react';
import Register from './components/Register';

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
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
    fetchActivities();
  }, []);
  
  // Fetch both Strava and planned activities
  const fetchActivities = async () => {
    try {
      // Fetch both Strava and planned activities in parallel
      const [stravaResponse, plannedResponse] = await Promise.all([
        api.get('/api/strava/activities'),
        api.get('/api/planned-activities')
      ]);

      // Map Strava activities to FullCalendar events
      const stravaEvents = stravaResponse.data.map(activity => ({
        id: activity.id,
        title: activity.name,
        start: activity.start_date, // FullCalendar will parse this date string
        extendedProps: {
          type: activity.type,
          distance: activity.distance,
          duration: activity.moving_time,
          planned: false // Flag to indicate this is a Strava activity
        },
      }));

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
  useEffect(() => {
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
  }, []); // Run only once after the initial render

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';    
  };

  // Custom buttons for the toolbar
  const customButtons = {
    logo: {
      text: 'Persimmon'
    },
    connectStrava: {
      text: 'Connect Strava',
      click: () => {
        window.location.href = '/connect-strava';
      }
    },
    logout: {
      text: 'Logout',
      click: handleLogout
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

    // Only allow editing of planned activities, not Strava activities
    if (event.extendedProps.planned) {
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
    }
  };

  // Handle saving or updating an activity
  const handleSaveActivity = async (activityData) => {
    try {
      let response;

      if (activityData.id) {
        // Update existing activity
        response = await api.put(`/api/planned-activities/${activityData.id}`, activityData);

        // Update the events array
        setEvents(prev =>
          prev.map(event =>
            event.id === activityData.id ? response.data : event
          )
        );
      } else {
        // Create new activity
        response = await api.post('/api/planned-activities', activityData);

        // Add the new activity to events
        setEvents(prev => [...prev, {
          ...response.data,
          extendedProps: {
            ...response.data.extendedProps,
            planned: true
          }
        }]);
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
      await api.delete(`/api/planned-activities/${activityId}`);

      // Remove the deleted activity from events
      setEvents(prev => prev.filter(event => event.id !== activityId));
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

  // Custom event content
  const handleEventContent = (eventInfo) => {
    const isPlanned = eventInfo.event.extendedProps.planned;
    return (
      <div className={`event-content ${isPlanned ? 'planned-activity' : ''}`}>
        <b>{eventInfo.event.title}</b>
        <br />
        <i>
          {eventInfo.event.extendedProps.type} - {eventInfo.event.extendedProps.distance} meters
          {eventInfo.event.extendedProps.shoes && ` - ${eventInfo.event.extendedProps.shoes}`}
        </i>
      </div>
    );
  };

  const handleDayHeader = (arg) => {
    // Get the full weekday name
    const weekdayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(arg.date);
    // Convert to uppercase
    return weekdayName.toUpperCase();
  }

  return (
    <div className="calendar-container">
      <FullCalendar
        ref = {calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView='dayGridMonth'
        headerToolbar={{
          left: 'logo today prev next', // Add icon as seperate button
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
        height="auto"
      />
      <ActivityPlannerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        selectedActivity={selectedActivity}
        onSave={handleSaveActivity}
        onDelete={handleDeleteActivity}
      />
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
        <Route
          path="/connect-strava"
          element={
            <PrivateRoute>
              <ConnectStrava />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;