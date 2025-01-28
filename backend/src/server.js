const express = require('express');
const dotenv = require('dotenv');
dotenv.config(); // to read environment variables from .env file

const app = express();
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
