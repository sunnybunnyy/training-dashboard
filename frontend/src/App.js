import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from "@fullcalendar/interaction" // needed for dayClick
import axios from 'axios';

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

  const handleDateClick = (arg) => {
    alert(arg.dateStr)
  }

  // Custom event content
  const renderEventContent = (eventInfo) => {
    return (
      <div>
        <b>{eventInfo.event.title}</b>
        <br />
        <i>{eventInfo.event.extendedProps.type} - {eventInfo.event.extendedProps.distance} meters</i>
      </div>
    );
  };

  return (
    <div>
      <h1>Strava Activities Calendar</h1>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView='dayGridMonth'
        weekends={true}
        events={events}
        eventContent={renderEventContent}
        dateClick={handleDateClick}
      />
    </div>
  )
}

// a custom render function
/* function renderEventContent(eventInfo) {
  return (
    <>
      <b>{eventInfo.timeText}</b>
      <i>{eventInfo.event.title}</i>
    </>
  )
} */

export default App;