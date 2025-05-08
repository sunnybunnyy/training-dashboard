const express = require('express');
const dotenv = require('dotenv');
const connectDB = require("../db/queries");

dotenv.config(); // Load environment variables from .env file
const app = express(); // Initialize the Express application

// Database connection
connectDB();

// Configurations
require('./config/express')(app);
require('./config/session')(app);
require('./config/passport')(app);

// Routes
app.use('/', require('./routes'));

// Error handling middleware
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT; // Get the port from environment variables
// Start the server
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));