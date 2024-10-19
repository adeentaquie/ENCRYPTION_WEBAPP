const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5001;

// VirusTotal API Key (Replace this with your actual key)
const VIRUSTOTAL_API_KEY = '09898e620789b624f8911c5f090fe24aa3651901ece97c940777e9166151557b';

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to encode URLs to Base64
const encodeUrl = (url) => {
    const buffer = Buffer.from(url);
    return buffer.toString('base64').replace(/=/g, '');
};

// Route to Check URL Authenticity
app.post('/check-url', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required.' });
    }

    try {
        // Encode the URL in Base64 and prepare the API request URL
        const encodedUrl = encodeUrl(url);
        const apiUrl = `https://www.virustotal.com/api/v3/urls/${encodedUrl}`;

        // Make the request to VirusTotal
        const response = await axios.get(apiUrl, {
            headers: {
                'x-apikey': VIRUSTOTAL_API_KEY,
            },
        });

        // Send response back to the client
        res.json({ data: response.data });
    } catch (error) {
        console.error('Error checking URL:', error.response?.data || error.message);

        // Handle 404 and 500 errors appropriately
        if (error.response?.status === 404) {
            return res.status(404).json({ error: 'Invalid or unknown URL.' });
        }
        res.status(500).json({ error: 'Failed to check URL. Please try again later.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`URL Checker server running on http://localhost:${PORT}`);
});
