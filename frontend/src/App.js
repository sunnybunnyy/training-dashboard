import React, { useEffect, useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from "@fullcalendar/interaction" // needed for dayClick
import axios from 'axios';
import './App.css';

const events = [
  { title: 'Meeting', start: new Date() }
]

function App() {
  const [events, setEvents] = useState([]);

  // Fetch Strava activities when the component mounts
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await axios.get('/api/strava/activities'); // Call the backend endpoint
        const activities = response.data;

        // Map Strava activities to FullCalendar events
        const calendarEvents = activities.map(activity => ({
          id: activity.id,
          title: activity.name,
          start: activity.start_date, // FullCalendar will parse this date string
          extendedProps: {
            type: activity.type,
            distance: activity.distance,
            duration: activity.moving_time,
          },
        }));
        setEvents(calendarEvents);
      } catch (error) {
        console.error('Error fetching Strava activities:', error);
      }
    };

    fetchActivities();
  }, []);

  // Custom rendering for the icon button
  const customButtons = {
  icon: {}
};

  // Handle date clicks
  const handleDateClick = (arg) => {
    alert(arg.dateStr)
  }

  // Custom event content
  const handleEventContent = (eventInfo) => {
    return (
      <div className="event-content">
        <b>{eventInfo.event.title}</b>
        <br />
        <i>{eventInfo.event.extendedProps.type} - {eventInfo.event.extendedProps.distance} meters</i>
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
      <h1>Training Calendar</h1>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView='dayGridMonth'
        headerToolbar={{
          left: 'icon today prev next', // Add icon as seperate button
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        customButtons={customButtons}
        dayHeaderContent={handleDayHeader}
        weekends={true}
        events={events}
        eventContent={handleEventContent}
        dateClick={handleDateClick}
        height="auto"
      />
    </div>
  );
}

export default App;