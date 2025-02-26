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
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); } // Proceed if authenticated
  res.redirect('/login') // Redirect to login if not authenticated
}

async function getPlannedActivities(req, res){
  const plannedActivities = await db.getAllPlannedActivities();
  console.log("Planned activities: ", plannedActivities);
  const formattedData = plannedActivities.map(plannedActivity => `${plannedActivity.id}  (title: ${plannedActivity.title}, date: ${plannedActivity.date}, type: ${plannedActivity.type}, distance: ${plannedActivity.distance}, duration: ${plannedActivity.duration}, route: ${plannedActivity.route}, shoes: ${plannedActivity.shoes})`).join(", ");
  res.send("Planned activities: " + formattedData);
} 

async function createPlannedActivityGet(req, res) {
  // TODO
}

async function createPlannedActivityPost(req, res){
  const { strava_id, id,  title, date, type, distance, duration, route, shoes } = req.body;
  await db.insertActivity(strava_id, id,  title, date, type, distance, duration, route, shoes);
  res.redirect('/');
} 

module.exports = {
  getPlannedActivities,
  createPlannedActivityGet,
  createPlannedActivityPost
};