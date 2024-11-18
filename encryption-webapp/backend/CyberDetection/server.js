const express = require('express');
const cors = require('cors'); // Import CORS middleware
const cyberDetectionRoutes = require('./routes'); // Corrected path to routes.js

const app = express();

// Enable CORS to allow requests from different origins
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Add CyberDetection routes
app.use('/cyber-detection', cyberDetectionRoutes);

// Start the server
const PORT = 5003;
app.listen(PORT, () => console.log(`CyberDetection server running on http://localhost:${PORT}`));
