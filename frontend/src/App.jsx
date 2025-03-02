import './App.css';
import ActivityPlannerModal from './ActivityPlannerModal';
import axios from 'axios';
import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/react'
import interactionPlugin from "@fullcalendar/interaction" // needed for dayClick
import React, { useEffect, useState, useRef } from 'react';

function App() {
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const calendarRef = useRef(null);

  // Fetch Strava activities when the component mounts
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Fetch both Strava and planned activities in parallel
        const [stravaResponse, plannedResponse] = await Promise.all([
          axios.get('/api/strava/activities'),
          axios.get('/api/planned-activities')
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
      const response = await axios.post('/api/planned-activities', newActivity);

      // Update local state with the saved activity from the backend
      // This ensures we have any additional fields the backend adds, like ID
      setEvents(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Error saving planned activity:', error);
      // TODO: Display an error message to the user
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
  );
}

export default App;