const axios = require('axios');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const db = require("../../db/queries");
const dotenv = require('dotenv');
const express = require('express');
const jwt = require('jsonwebtoken');
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

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

app.get('/connect-strava', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

// GET /auth/strava
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Strava authentication will involve
//   redirecting the user to strava.com.  After authorization, Strava
//   will redirect the user back to this application at /auth/strava/callback
// Check for logged-in user first
app.get('/auth/strava', async (req, res, next) => {
  try {
    // Extract user ID from token if available
    const authHeader = req.headers['authorization'];
    let userId = null;

    if (authHeader) {
      // Try to get user from token
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
        // Store the userId in a local variable since we have it from the token
        req.userId = userId;
      } catch (error) {
        console.log('Token verification failed:', err.message);
      }
    }

    // If token auth failed, check session
    if (!userId && req.session && req.session.userId) {
      userId = req.session.userId;
      req.userId = userId;
    }

    // If we still don't have a userId, redirect to login
    if (!userId) {
      console.log('No user ID found, redirecting to login');
      return res.redirect('/login');
    }

    console.log('Using user ID:', userId);

    // Now try to get Strava credentials
    let rows = [];
    try {
      // Get user's Strava credentials if they exist
      rows = await db.getStravaCredentials(userId);
    } catch (err) {
      console.error('Error getting Strava credentials:', err);
      // Continue with empty rows - we'll use default credentials
    }

    if (rows && rows.length > 0) {
      // User has Strava credentials, use them
      const { client_id, client_secret } = rows[0];

      // Store in session for callback
      req.session.userId = userId;

      // Configure a strategy for this specific user
      const strategyName = `strava-${userId}`;

      // Configure Passport to use the Strava OAuth2 strategy
      passport.use(strategyName, new StravaStrategy({
        clientID: client_id,
        clientSecret: client_secret,
        callbackURL: `http://localhost:${port}/auth/strava/callback` // Callback URL after Strava authentication
      },
      function(accessToken, refreshToken, profile, done) {
        // Asynchronous verification function
        process.nextTick(function () {
          // Store the tokens with the user's credentials
          db.saveStravaCredentials(
            userId,
            client_id,
            client_secret,
            accessToken,
            refreshToken,
            new Date(Date.now() + 21600000) // Token expires in 6 hours
          ).then(() => {
            profile.userId = userId;
            profile.token = accessToken;
            return done(null, profile);
          }).catch(err => {
            return done(err);
          });
          // To keep the example simple, the user's Strava profile is returned to
          // represent the logged-in user.  In a typical application, you would want
          // to associate the Strava account with a user record in your database,
          // and return that user instead.
        });
      }));

      // Use the user-specific strategy
      passport.authenticate(strategyName, { scope: ['activity:read_all'] })(req, res, next);
    } else {
        // User doesn't have Strava credentials yet, use default appliaction credentials
        console.log('No Strava credentials found, using default');

        // Store in session for callback
        req.session.userId = userId;

        // TODO: Don't use any credentials
        passport.use('default-strava', new StravaStrategy({
          clientID: process.env.STRAVA_CLIENT_ID,
          clientSecret: process.env.STRAVA_CLIENT_SECRET,
          callbackURL: `http://localhost:${port}/auth/strava/callback`
        },
        function(accessToken, refreshToken, profile, done) {
          process.nextTick(function () {
            // Link this Strava profile to the current user
            profile.userId = userId;
            profile.token = accessToken;

            // Save initial Strava tokens for the user
            db.saveStravaCredentials(
              userId,
              process.env.STRAVA_CLIENT_ID,
              process.env.STRAVA_CLIENT_SECRET,
              accessToken,
              refreshToken,
              new Date(Date.now() + 21600000) // Token expires in 6 hours
            ).then(() => {
              return done(null, profile);
            }).catch(err => {
              return done(err);
            });
          });
        }));

        // Use the default strategy
        passport.authenticate('default-strava', { scope: ['activity:read_all'] })(req, res, next);
    }
  } catch (error) {
    console.error('Strava authentication error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Strava' });
  }
  
// Request access to Strava activities
});

// GET /auth/strava/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
// Maintains JWT authentication
app.get('/auth/strava/callback', (req, res, next) => {
  // Get userId from session
  const userId = req.session.userId;
  if (!userId) {
    return res.redirect('/login');
  }
  
  const strategyName = `strava-${userId}` in passport._strategies ?
                      `strava-${userId}` : 'default-strava';
  
  passport.authenticate(strategyName, { 
    failureRedirect: '/login', 
    successRedirect: '/dashboard' 
  })(req, res, next); // Redirect to login on failure
});

app.get('/dashboard', (req, res) => {
    // TODO: Now that Strava auth is complete, redirect to the dashboard
    // res.redirect('/dashboard');
    // Serve the frontend's index.html file after successful authentication
    res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
})


app.get('/api/profile', authenticateToken, async (req, res) => {
  try { 
    const rows = await db.getUserById(req.user.id);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.get('/api/strava/activities', authenticateToken, async (req, res) => {
    try {
      // Get user's Strava credentials
      const rows = await db.getStravaCredentials(req.user.id);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Strava credentials not found for this user' });
      }

      const { access_token } = rows[0];

      // Use the user's Strava access token
      const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      res.json(response.data); // Send activities to the frontend
    } catch (error) {
      console.error('Error fetching Strava activities:', error);
      res.status(500).json({error: 'Failed to fetch Strava activities'});
    } 
  });


// GET planned activities
app.get('/api/planned-activities', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const plannedActivities = await db.getPlannedActivitiesByUserId(userId);
  
    if (typeof plannedActivities === "undefined") {
      return res.send([]);
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
      return res.send(events);
    }
  } catch (error) {
    console.error('Error fetching planned activities:', error);
    res.status(500).json({ error: 'Failed to fetch planned activities' });
  }
});

// POST new planned activitiy
app.post('/api/planned-activities', authenticateToken, async (req, res) => {
  try {
    const { title, start, extendedProps } = req.body;
    const userId = req.user.id;

    const result = await db.insertActivity(
      userId, 
      title, 
      start, 
      extendedProps.type, 
      extendedProps.distance, 
      extendedProps.duration, 
      extendedProps.route, 
      extendedProps.shoes
    );
    
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
  } catch (error) {
    console.error('Error creating planned activity:', error);
    res.status(500).json({ error: 'Failed to create planned activity' });
  }
});

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

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const rows = await db.getUserByEmail(email);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Store user ID in session for possible Strava auth later
    req.session.userId = user.id;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.put('/api/planned-activities/:id', authenticateToken, async (req, res) => {
  try {
    const activityId = req.params.id;
    const { title, start, extendedProps } = req.body;
    const userId = req.user.id;

    // Verify the activity belongs to the user
    const existingActivity = await db.getActivityById(activityId);
    if (!existingActivity || existingActivity.user_id !== userId) {
      return res.status(404).json({ error: 'Activity not found or access denied' });
    }

    // Update the activity
    await db.updateActivity(
      activityId,
      title,
      start,
      extendedProps.type,
      extendedProps.distance,
      extendedProps.duration,
      extendedProps.route,
      extendedProps.shoes
    );

    // Return the updated activity in FullCalendar format
    const updatedActivity = {
      id: activityId,
      title: title,
      start: start,
      extendedProps: {
        type: extendedProps.type,
        distance: extendedProps.distance,
        duration: extendedProps.duration,
        route: extendedProps.route,
        shoes: extendedProps.shoes,
        planned: true
      }
    };

    res.json(updatedActivity);
  } catch (error) {
    console.error('Error updating planned activity:', error);
    res.status(500).json({ error: 'Failed to update planned activity' });
  }
});

// DELETE planned activity
app.delete('/api/planed-activities/:id', authenticateToken, async (req, res) => {
  try {
    const activityId = req.params.id;
    const userId = req.user.id;

    // Verify the activity belongs to the user
    const existingActivity = await db.getActivityById(activityId);
    if (!existingActivity || existingActivity.user_id !== userId) {
      return res.status(404).json({ error: 'Activity not found or access denied' });
    }

    // Delete the activity
    await db.deleteActivity(activityId);

    res.status(200).json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error()
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

// Authenticate token middleware
function authenticateToken (req, res, next) {
  // Get auth header value
  const authHeader = req.headers['authorization'];

  if (typeof authHeader === 'undefined') {
    // Forbidden
    return res.sendStatus(403);
  }
  
  // Split at the space and get the token from the array
  const token =  authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    } 

    // Set the user on the request object
    req.user = user;
    next();
  });
}