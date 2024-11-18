const express = require('express');
const { spawn } = require('child_process');
const router = express.Router();

router.post('/predict', (req, res) => {
    const { tweet } = req.body;
    console.log('Received tweet:', tweet); // Log the received tweet

    if (!tweet) {
        console.error('No tweet provided.');
        return res.status(400).json({ error: 'Tweet is required' });
    }

    const python = spawn('python', ['predict.py', tweet]);

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
        output += data.toString();
    });

    python.stderr.on('data', (data) => {
        error += data.toString();
    });

    python.on('close', (code) => {
        if (code === 0) {
            console.log('Prediction result:', output.trim());
            res.json({ result: output.trim() });
        } else {
            console.error('Python script error:', error);
            res.status(500).json({ error: error || 'Unknown error in Python script.' });
        }
    });
});


module.exports = router;
