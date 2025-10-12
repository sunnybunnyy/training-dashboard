import redisClient from './redisClient.js';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import * as db from '../db/queries.js'; // note: add .js if using ESM
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import methodOverride from 'method-override';
import morgan from 'morgan';
import passport from 'passport';
import path from 'path';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Strategy as StravaStrategy } from 'passport-strava-oauth2';
import { fileURLToPath } from 'url';

dotenv.config(); // Load environment variables from .env file
const port = process.env.PORT; // Get the port from environment variables

const app = express(); // Initialize the Express application

const startCache = async () => {
  try {
    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (err) {
    console.error('Could not connect to Redis', err);
  }
};

startCache();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Express settings
app.set('views', __dirname + '/views'); // Initialize the Express application
app.set('view engine', 'ejs'); // Initialize the Express application

// Middleware setup
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(cookieParser()); // Parse cookies
app.use(cors({
  origin: ['http://localhost:3000',
            process.env.FRONTEND_URL,
            process.env.API_BASE_URL],
  credentials: true
}));
app.use(helmet());
app.use(methodOverride('_method')); // Allow HTTP method overriding
app.use(morgan('dev')); // Log HTTP requests in 'dev' format
const pgSession = connectPgSimple(session);
app.use(session({
  store: new pgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET, // Secret used to sign the session ID cookie
  resave: false, // Don't save the session if it wasn't modified
  saveUninitialized: false, // Save new sessions
  cookie: { 
    secure: true,
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days 
    sameSite: 'none'
  } // Cookie settings
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

// Serve static files from the frontend build directory
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

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
    const callbackURL = process.env.NODE_ENV === 'production'
      ? `https://persimmon-u8l4.onrender.com/auth/strava/callback?userId=${userId}`
      : `http://localhost:${port}/auth/strava/callback?userId=${userId}`;

    if (req.query.token) {
      try {
        const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
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
        callbackURL: callbackURL // Callback URL after Strava authentication
      },
      function(accessToken, refreshToken, profile, done) {
        // Asynchronous verification function
        process.nextTick(function () {
          // Store all token info
          db.saveStravaCredentials(
            userId,
            client_id,
            client_secret,
            accessToken,
            refreshToken,
            new Date(Date.now() + 21600) // Token expires in 6 hours
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
          callbackURL: callbackURL
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
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
  // Get userId from session
  const userId = req.query.userId;
  if (!userId) {
    return res.redirect(`${FRONTEND_URL}/login`);
  }
  
  const strategyName = `strava-${userId}` in passport._strategies ?
                      `strava-${userId}` : 'default-strava';
  
  passport.authenticate(strategyName, { 
    failureRedirect: `${FRONTEND_URL}/login`, 
    successRedirect: `${FRONTEND_URL}/dashboard` 
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

// GET Strava activities
// Check Redis for cached activities first
// If not found or expired, fetch from Strava API
// Store transformed activities in Redis
// Next request within 10 minutes will use cached data
app.get('/api/strava/activities', authenticateToken, async (req, res) => {
  const cacheKey = `strava:activities:${req.user.id}`; 
  try {
    // Check Redis cache first
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log('Serving Strava activities from cache');
      return res.json(JSON.parse(cachedData));
    }
    console.log('No cache found, fetching from Strava API');

    // Get user's Strava credentials
    const rows = await db.getStravaCredentials(req.user.id);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Strava credentials not found for this user' });
    }

    const { access_token, refresh_token, client_id, client_secret, expires_at } = rows[0];

    // Convert expires_at to Date if it's not already
    const expiresAtDate = expires_at instanceof Date ? expires_at : new Date(expires_at);
    const now = new Date();

    // Check if token is expired
    let currentToken = access_token;
    if (expiresAtDate < now) {
      console.log('Token expired, refreshing...');
      try {
        currentToken = await refreshStravaToken(req.user.id, refresh_token, client_id, client_secret);
      } catch (refreshError) {
        console.error('Failed to refresh token, user may need to re-authorize');
        return res.status(401).json({
          error: 'Strava authorization expired',
          message: 'Please reconnect your Strava account'
        });
      }
    }

      // Make the Strava API call
    try {
      const stravaResponse = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      // Fetch the user's training plans to match with activities
      const trainingPlans = await db.getTrainingPlansByUserId(req.user.id);
      if (!trainingPlans) {
        console.error('Invalid training plans response:', trainingPlans);
        throw new Error('Invalid training plans data structure');
      }

      // Fetch existing Strava activities with associated plans from database
      const existingStravaActivities = await db.getStravaActivitiesByUserId(req.user.id);

      if (!existingStravaActivities) {
        console.error('Invalid existing activities response:', existingStravaActivities);
        throw new Error('Invalid existing activities data structure');
      }

      // Create a map of exisiting activity plan associations
      const planAssociationMap = existingStravaActivities.reduce((acc, activity) => {
        acc[activity.strava_id] = activity.plan_id;
        return acc;
      }, {});

      // Transform Strava activities with training plan info
      const activitiesWithPlans = stravaResponse.data.map(activity => {
        // Find associated training plan ID from our database
        const associatedPlanId = planAssociationMap[activity.id] || null;

        // Find the full training plan details
        const associatedPlan = associatedPlanId
          ? trainingPlans.find(plan => plan.id === associatedPlanId)
          : null;

        return {
          ...activity,
          trainingPlanId: associatedPlanId,
          trainingPlanName: associatedPlan ? associatedPlan.name : null,
          trainingPlanColor: associatedPlan ? associatedPlan.color : null
        };
      });

      await redisClient.set(cacheKey, JSON.stringify(activitiesWithPlans));

      res.json(activitiesWithPlans); // Send activities to the frontend
    } catch (apiError) {
      console.error('Strava API error:', apiError.response ? apiError.response.data : apiError.message);
      
      // Handle 401 errors specially
      if (apiError.response && apiError.response.status === 401) {
        console.log('Invalid token detected - user needs to re-authorize');
        
        // Clear the invalid credentials from the strava_credentials table
        await db.clearInvalidStravaCredentials(req.user.id);

        return res.status(401).json({
          error: 'Strava authorization required',
          message: 'Your Strava connection needs to be refreshed',
          action: 'reauthorize',
          authUrl: '/auth/strava'
        });
      }

      throw apiError; // Let the main catch handle other errors
    } 
  } catch (error) {
    console.error('Full error in Strava activities endpoint:', {
      error: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    res.status(500).json({error: 'Failed to fetch Strava activties'});
  }
});

// PUT update Strava activity training plan
app.put('/api/strava/activities/:id', authenticateToken, async (req, res) => {
  try {
    const stravaId = req.params.id;
    const { trainingPlanId } = req.body;
    const userId = req.user.id;

    // Convert trainingPlanId to integer or null
    const planId = trainingPlanId ? parseInt(trainingPlanId) : null;

    // Upsert the activity
    const result = await db.upsertStravaActivity(
      userId,
      stravaId,
      planId
    );

    // Fetch the training plan details if needed
    const trainingPlan = planId
      ? await db.getTrainingPlanById(planId)
      : null;

      res.json({
        success: true,
        activity: {
          id: stravaId,
          trainingPlanId: planId,
          trainingPlanName: trainingPlan?.name || null,
          trainingPlanColour: trainingPlan?.color || null
        }
      });
  } catch (error) {
    console.error('Error updating Strava activity plan:', error);
    res.status(500).json({ error: 'Failed to update Strava activity plan' });
  }
});

app.get('/api/user/strava-status', authenticateToken, async (req, res) => {
  try {
    // Get user's Strava credentials
    const rows = await db.getStravaCredentials(req.user.id);

    // Check if user has valid Strava credentials
    const connected = rows.length > 0 && rows[0].access_token;

    res.json({ connected });
  } catch (error) {
    console.error('Error checking Strava status:', error);
    res.status(500).json({ error: 'Failed to check Strava connection status' });
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

// GET planned activities
app.get('/api/planned-activities', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const plannedActivities = await db.getPlannedActivitiesByUserId(userId);
  
    // Fetch training plans to get their colors
    const trainingPlans = await db.getTrainingPlansByUserId(userId);
    const planMap = trainingPlans.reduce((map, plan) => {
      map[plan.id] = plan;
      return map;
    }, {});

    if (typeof plannedActivities === "undefined") {
      return res.send([]);
    } else {
      console.log("Planned activities: ", plannedActivities);
      const events = plannedActivities.map(plannedActivity => {
        // Find associated training plan if any
        const trainingPlan = plannedActivity.plan_id ? planMap[plannedActivity.plan_id] : null;
        
        return {
          id: plannedActivity.id,
          title: plannedActivity.title,
          start: plannedActivity.date,
          backgroundColor: trainingPlan ? trainingPlan.color : null,
          extendedProps: {
            planId: plannedActivity.plan_id,
            planName: trainingPlan ? trainingPlan.name : null,
            type: plannedActivity.type,
            distance: plannedActivity.distance,
            duration: plannedActivity.duration,
            route: plannedActivity.route,
            shoes: plannedActivity.shoes,
            planned: true
          }
        };  
      });
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
      extendedProps.planId || null,
      title, 
      start, 
      extendedProps.type, 
      extendedProps.distance, 
      extendedProps.duration, 
      extendedProps.route, 
      extendedProps.shoes
    );
    
    // Fetch the training plan to get its colour
    const trainingPlan = extendedProps.planId
      ? await db.getTrainingPlanById(extendedProps.planId)
      : null;

    // Transform the response to match the FullCalendar event format
    const savedActivity = {
      id: result.id,
      title: title,
      start: start,
      backgroundColor: trainingPlan ? trainingPlan.color: null,
      extendedProps : {
        planId: extendedProps.planId || null,
        type: extendedProps.type,
        distance: extendedProps.distance,
        duration: extendedProps.duration,
        route: extendedProps.route,
        shoes: extendedProps.shoes,
        planned: true
      }
    };
    await redisClient.del(`strava:activities:${userId}`); // Clear Strava activities cache since we added a planned activity
    res.status(201).json(savedActivity);
  } catch (error) {
    console.error('Error creating planned activity:', error);
    res.status(500).json({ error: 'Failed to create planned activity' });
  }
});

// PUT update planned activity
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
      extendedProps.planId || null,
      title,
      start,
      extendedProps.type,
      extendedProps.distance,
      extendedProps.duration,
      extendedProps.route,
      extendedProps.shoes
    );

    // Fetch the training plan to get its colour
    const trainingPlan = extendedProps.planId
      ? await db.getTrainingPlanById(extendedProps.planId)
      : null;

    // Return the updated activity in FullCalendar format
    const updatedActivity = {
      id: activityId,
      title: title,
      start: start,
      backgroundColor: trainingPlan ? trainingPlan.color : null,
      extendedProps: {
        planId: extendedProps.planId || null,
        type: extendedProps.type,
        distance: extendedProps.distance,
        duration: extendedProps.duration,
        route: extendedProps.route,
        shoes: extendedProps.shoes,
        planned: true
      }
    };

    await redisClient.del(`strava:activities:${userId}`);
    res.json(updatedActivity);
  } catch (error) {
    console.error('Error updating planned activity:', error);
    res.status(500).json({ error: 'Failed to update planned activity' });
  }
});

// DELETE planned activity
app.delete('/api/planned-activities/:id', authenticateToken, async (req, res) => {
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
    await redisClient.del(`strava:activities:${userId}`);
    res.status(200).json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting planned activity:', error);
    res.status(500).json({ error: 'Failed to delete planned activity' });
  }
});


// GET training plans
app.get('/api/training-plans', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const trainingPlans = await db.getTrainingPlansByUserId(userId);

    res.json(trainingPlans);
  } catch (error) {
    console.error('Error fetching training plans:', error);
    res.status(500).json({ error: 'Failed to fetch training plans' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

// POST new training plan
app.post('/api/training-plans', authenticateToken, async (req, res) => {
  try {
    const { name, color, description } = req.body;
    const userId = req.user.id;

    const trainingPlan = await db.createTrainingPlan(userId, name, color, description);

    res.status(201).json(trainingPlan);
  } catch (error) {
    console.error('Error creating training plan:', error);
    res.status(500).json({ error: 'Failed to create training plan' });
  }
});

// PUT update training plan
app.put('/api/training-plans/:id', authenticateToken, async (req, res) => {
  try {
    const planId = req.params.id;
    const { name, color, description } = req.body;
    const userId = req.user.id;

    // Verify the plan belongs to the user
    const plans = await db.getTrainingPlansByUserId(userId);
    const userPlanIds = plans.map(p => p.id);

    if (!userPlanIds.includes(parseInt(planId))) {
      return res.status(404).json({ error: 'Training plan not found or access denied' });
    }

    const updatedPlan = await db.updateTrainingPlan(planId, name, color, description);
    
    res.json(updatedPlan);
  } catch (error) {
    console.error('Error updating training plan:', error);
    res.status(500).json({ error: 'Failed to update training plan' });
  }
});

// DELETE training plan
app.delete('/api/training-plans/:id', authenticateToken, async (req, res) => {
  try {
    const planId = req.params.id;
    const userId = req.user.id;

    // Verify the plan belongs to the user
    const plans = await db.getTrainingPlansByUserId(userId);
    const userPlanIds = plans.map(p => p.id);

    if (!userPlanIds.includes(parseInt(planId))) {
      return res.status(404).json({ error: 'Training plan not found or access denied' });
    }

    await db.deleteTrainingPlan(planId);

    res.status(200).json({ message: 'Training plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting training plan:', error);
    res.status(500).json({ error: 'Failed to delete training plan' });
  }
});


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

async function refreshStravaToken(userId, refreshToken, clientId, clientSecret) {
  try {
    // Make request to Strava to refresh the token
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    const expiresInSeconds = response.data.expires_in || 21600;
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);
    // Update the tokens in database
    await db.saveStravaCredentials(
      userId,
      clientId,
      clientSecret,
      response.data.access_token,
      response.data.refresh_token,
      new Date(Date.now() + (response.data.expires_in * 21600))
      // expiresAt
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Error refreshing Strava token:', error);
    throw error;
  }
}