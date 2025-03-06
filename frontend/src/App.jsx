import './App.css';
import ActivityPlannerModal from './ActivityPlannerModal';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from  'react-router-dom';
import ConnectStrava from './components/ConnectStrava';
import Dashboard from './components/Dashboard';
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
          },
        }));

        // Planned activities should already be in the right format
        const plannedEvents = plannedResponse.data;

        // Combine both type of events
        setEvents([...stravaEvents, ...plannedEvents]);
      } catch (error) {
        console.error('Error fetching Strava activities:', error);
        // If unauthorized, redirect to login
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    };

    fetchActivities();
  }, []);

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

    // Custom rendering for the icon button
  const customButtons = {
    logo: {
      text: 'Persimmon'
    }
  };

  // Handle date clicks
  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    setIsModalOpen(true);
  };

  // Handle saving the planned activity
  const handleSaveActivity = async (newActivity) => {
    try {
      // Send the new activity to the backend
      const response = await api.post('/api/planned-activities', newActivity);

      // Update local state with the saved activity from the backend
      // This ensures we have any additional fields the backend adds, like ID
      setEvents(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Error saving planned activity:', error);
      // If unauthorized, redirect to login
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
  }

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
    <div className="dashboard-container">
      <header className="app-header">
        <h1>Persimmon</h1>
        <nav>
          <a href="/connect-strava" className="nav-link">Connect Strava</a>
          <button
            className="logout-button"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
          >
            Logout
          </button>
        </nav>
      </header>

      <div className="calendar-container">
        <FullCalendar
          ref = {calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView='dayGridMonth'
          headerToolbar={{
            left: 'logo today prev next', // Add icon as seperate button
            center: 'title',
            right: ''
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
          height="auto"
        />
        <ActivityPlannerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedDate={selectedDate}
          onSave={handleSaveActivity}
        />
      </div>
    </div>
  );
};

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