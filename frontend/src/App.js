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

  // Handle date clicks
  const handleDateClick = (arg) => {
    alert(arg.dateStr)
  }

  // Function to adjust event text size
  const adjustEventTextSize = (eventEl) => {
    // Reset the font size to its default value before recalculating
    // eventEl.style.fontSize = '';

    const cell = eventEl.parentElement;
    const cellHeight = cell.clientHeight; // Get the cell height
    const cellWidth = cell.clientWidth; // Get the cell width
    console.log('Cell Height:', cellHeight, 'Cell Width:', cellWidth);
    
    // Calculate font size based on cell size
    const fontSize = Math.min(cellHeight, cellWidth) * 0.5;
    eventEl.style.fontSize = `${fontSize}px`;
    console.log('Applied Font Size:', fontSize);
  };
  // Custom event content
  const renderEventContent = (eventInfo) => {
    return (
      <div className="event-content">
        <b>{eventInfo.event.title}</b>
        <br />
        <i>{eventInfo.event.extendedProps.type} - {eventInfo.event.extendedProps.distance} meters</i>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <h1>Strava Activities Calendar</h1>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView='dayGridMonth'
        weekends={true}
        events={events}
        eventContent={renderEventContent}
        dateClick={handleDateClick}
        height="auto"
      />
    </div>
  );
}

export default App;