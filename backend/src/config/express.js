const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

module.exports = (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(helmet());
  app.use(cors({
    origin: ['http://localhost:3000',
              process.env.FRONTEND_URL,
              process.env.API_BASE_URL],
    credentials: true
  }));
  app.use(morgan('dev')); // Log HTTP requests in 'dev' format
  // Serve static files from the frontend build directory
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
};
