// Load the Express library
const express = require("express");

// Create the Express application
const app = express();

// The port number our server will listen on
const PORT = 5000;

// A route: when someone visits "/", send back a message
app.get("/", (req, res) => {
  res.send("ClinicBook API is running");
});

// Start the server and wait for requests
app.listen(PORT, () => {
  console.log("Server is running on http://localhost:" + PORT);
});