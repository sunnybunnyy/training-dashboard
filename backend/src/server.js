const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config(); // to read environment variables from .env file

const app = express();
const port = process.env.PORT || 5000;

/*app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});*/

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const passport = require('passport');
const util = require('util');
const StravaStrategy = require('passport-strava-oauth2').Strategy;
const morgan = require('morgan'); // Import morgan
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const session = require('express-session');

var STRAVA_CLIENT_ID = '145133';
var STRAVA_CLIENT_SECRET = '943bd105dc8f5509a61c2444d96bb342c43f465c';


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Strava profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the StravaStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Strava
//   profile), and invoke a callback with a user object.
passport.use(new StravaStrategy({
    clientID: STRAVA_CLIENT_ID,
    clientSecret: STRAVA_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:5000/auth/strava/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      console.log("Strava Profile:", profile);
      // To keep the example simple, the user's Strava profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Strava account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(morgan('dev')); // Use morgan to log requests in 'dev' format
app.use(cookieParser());
app.use(bodyParser.json());
app.use(methodOverride('_method')); // Use method-override middleware
app.use(session({
    secret: 'super-secure-strava-training-dashboard',
    resave: false,
    saveUninitialized: true,
    cookie: { sercure: false }
    })); // Use session middleware
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

console.log('Serving static files from:', path.join(__dirname, '../../frontend/build'));


/*(app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'))
})*/

app.get('/', function(req, res){
  console.log("Redirecting to /auth/strava...");
  res.redirect('/auth/strava');
});
/*
app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});*/

// GET /auth/strava
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Strava authentication will involve
//   redirecting the user to strava.com.  After authorization, Strava
//   will redirect the user back to this application at /auth/strava/callback
app.get('/auth/strava',
  passport.authenticate('strava', { scope: ['public'] })
);

// GET /auth/strava/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/strava/callback', 
  passport.authenticate('strava', { failureRedirect: '/login' }),
  function(req, res) {
    console.log("User authenticated:", req.user);
    res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
  });

  app.use(express.static(path.join(__dirname, '../../frontend/build')));

/*
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});*/

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}