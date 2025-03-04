const axios = require('axios');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const db = require("../../db/queries");
const dotenv = require('dotenv');
const express = require('express');
const methodOverride = require('method-override');
const morgan = require('morgan');
const passport = require('passport');
const path = require('path');
const router = express.Router();
const session = require('express-session');
const StravaStrategy = require('passport-strava-oauth2').Strategy;
const util = require('util');

dotenv.config(); // Load environment variables from .env file
const port = process.env.PORT; // Get the port from environment variables

const app = express(); // Initialize the Express application

// Configure Express settings
app.set('views', __dirname + '/views'); // Initialize the Express application
app.set('view engine', 'ejs'); // Initialize the Express application

// Middleware setup
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(cookieParser()); // Parse cookies
app.use(methodOverride('_method')); // Allow HTTP method overriding
app.use(morgan('dev')); // Log HTTP requests in 'dev' format
app.use(session({
  secret: process.env.SESSION_SECRET, // Secret used to sign the session ID cookie
  resave: false, // Don't save the session if it wasn't modified
  saveUninitialized: true, // Save new sessions
  cookie: { secure: false } // Cookie settings
}));

// Initialize Passport for authentication
app.use(passport.initialize());
app.use(passport.session()); // Enable persistent login sessions

// Configure Passport to use the Strava OAuth2 strategy
passport.use(new StravaStrategy({
  clientID: process.env.STRAVA_CLIENT_ID, // Strava client ID from environment variables
  clientSecret: process.env.STRAVA_CLIENT_SECRET, // Strava client secret from environment variables
  callbackURL: `http://localhost:${port}/auth/strava/callback` // Callback URL after Strava authentication
},
function(accessToken, refreshToken, profile, done) {
  // Asynchronous verification function
  process.nextTick(function () {
    // To keep the example simple, the user's Strava profile is returned to
    // represent the logged-in user.  In a typical application, you would want
    // to associate the Strava account with a user record in your database,
    // and return that user instead.
    return done(null, profile);
  });
}));

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Strava profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
  // Serialize only essential user info to store in the session
  done(null, {
    id: user.id,
    displayName: user.displayName,
    token: user.token
  });
});

passport.deserializeUser(function(serializedUser, done) {
  // Deserialize the user from the session
  done(null, serializedUser);
});

// Root route: Redirect to Strava authentication
app.get('/', (req, res) => {
  res.redirect('/auth/strava');
});

// GET /auth/strava
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Strava authentication will involve
//   redirecting the user to strava.com.  After authorization, Strava
//   will redirect the user back to this application at /auth/strava/callback
app.get('/auth/strava',
  passport.authenticate('strava', { scope: ['activity:read_all'] })
// Request access to Strava activities
);

// GET /auth/strava/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/strava/callback', 
  passport.authenticate('strava', { failureRedirect: '/login' }), // Redirect to login on failure
  ensureAuthenticated, // Ensure the user is authenticated
  (req, res, next) => {
    if (!req.user) {
      return res.redirect('/login'); // Redirect to login if no user is found
    }
    // Serve the frontend's index.html file after successful authentication
    res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
  });

app.get('/api/strava/activities', ensureAuthenticated,
  async (req, res) => {
    try {
      const accessToken = req.user.token;
      const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      res.json(response.data); // Send activities to the frontend
    } catch (error) {
      console.error('Error fetching Strava activities:', error);
      res.status(500).json({error: 'Failed to fetch Strava activities'});
    } 
  });


// GET planned activities
app.get('/api/planned-activities', async (req, res) => {
  try {
    getPlannedActivities(req, res);
  } catch (error) {
    console.error('Error fetching planned activities:', error);
  }
})

// POST new planned activitiy
app.post('/api/planned-activities', async (req, res) => {
  try {
    createPlannedActivityPost(req, res);
  } catch (error) {
    console.error('Error creating planned activity:', error);
  }
})

app.post('/api/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const user = await db.createUser(email, password, firstName, lastName);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Serve static files from the frontend build directory
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.

// Authenticate token
function authenticateToken (req, res, next) {
  // Get auth header value
  const authHeader = req.headers['authorization'];

  // Check if auth header is undefined
  if (typeof authHeader !== 'undefined') {
    // Split at the space and get the token from the array
    const token =  authHeader.split(' ')[1];
    // Set the token
    req.token = token;
    // Next middleware
    next();
  } else {
    // Forbidden
    return res.sendStatus(403);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    } else {
      res.json({
        message: 'Sucess with jwt!',
        user
      });
    }
    req.user = user;
    next();
  });
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); } // Proceed if authenticated
  res.redirect('/login') // Redirect to login if not authenticated
}

async function getPlannedActivities(req, res){
  const plannedActivities = await db.getAllPlannedActivities();
  
  if (typeof plannedActivities === "undefined") {
    return res.json([]);
  } else {
    console.log("Planned activities: ", plannedActivities);
    const events = plannedActivities.map(plannedActivity => ({
      id: plannedActivity.id,
      title: plannedActivity.title,
      start: plannedActivity.date,
      extendedProps: {
        type: plannedActivity.type,
        distance: plannedActivity.distance,
        duration: plannedActivity.duration,
        route: plannedActivity.route,
        shoes: plannedActivity.shoes
      }
    }));
    return res.json(events);
  }
} 

async function createPlannedActivityGet(req, res) {
  // TODO
}

async function createPlannedActivityPost(req, res){
  const { title, start, extendedProps } = req.body;
  const strava_id = 145133; // TODO: fetch user's strava id
  const result = await db.insertActivity(strava_id, title, start, extendedProps.type, extendedProps.distance, extendedProps.duration, extendedProps.route, extendedProps.shoes);
  
  // Transform the response to match the FullCalendar event format
  const savedActivity = {
    title: title,
    start: start,
    extendedProps : {
      type: extendedProps.type,
      distance: extendedProps.distance,
      duration: extendedProps.duration,
      route: extendedProps.route,
      shoes: extendedProps.shoes
    }
  };

  res.status(201).json(savedActivity);
} 

module.exports = {
  getPlannedActivities,
  createPlannedActivityGet,
  createPlannedActivityPost
};