const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// MongoDB setup
mongoose.connect('mongodb+srv://passwordencryption:12345@cluster0.0bwmu.mongodb.net/encryption?retryWrites=true&w=majority')
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((error) => console.error('Error connecting to MongoDB:', error));

// Define File schema for MongoDB
const fileSchema = new mongoose.Schema({
    filename: String,
    encryptedData: String,
    iv: String,
    salt: String,
    passwordHash: String, // Store hashed password
    date: { type: Date, default: Date.now }
});
const File = mongoose.model('File', fileSchema);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const upload = multer();

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'adeentaquie2002@gmail.com',
        pass: 'cgjq wtdd xzvg dvcm'
    }
});

// Helper function to derive key and IV from password
function getKeyAndIV(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

// Endpoint to encrypt a file and send the hashed password via email
app.post('/encrypt-with-password', upload.single('fileData'), async (req, res) => {
    const { password, filename, email } = req.body;
    const fileData = req.file;

    if (!password || !fileData || !filename || !email) {
        return res.status(400).json({ error: "Password, fileData, filename, and email are required" });
    }

    try {
        // Generate salt, IV, and encryption key
        const salt = crypto.randomBytes(16);
        const iv = crypto.randomBytes(16);
        const key = getKeyAndIV(password, salt);

        // Encrypt the binary file data
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        const encrypted = Buffer.concat([cipher.update(fileData.buffer), cipher.final()]);

        // Hash the password for secure storage
        const passwordHash = await bcrypt.hash(password, 10);

        // Save file metadata to the database
        const file = new File({
            filename,
            encryptedData: encrypted.toString('hex'), // Store encrypted data as HEX
            iv: iv.toString('hex'),
            salt: salt.toString('hex'),
            passwordHash,
        });

        await file.save();

        // Send email with the hashed password
        const mailOptions = {
            from: 'adeentaquie2002@gmail.com',
            to: email,
            subject: 'Your Encrypted File Hashed Password',
            text: `Here is the hashed password for decrypting the file: ${passwordHash}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).json({ error: "Error sending email" });
            }
            res.json({ message: "File encrypted and email sent successfully" });
        });

    } catch (error) {
        console.error("Encryption error:", error);
        res.status(500).json({ error: "Error encrypting file" });
    }
});


// Endpoint to decrypt a file using a password
app.post('/decrypt-with-password', upload.none(), async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: "Password is required" });
    }

    try {
        const files = await File.find();

        for (let file of files) {
            const passwordMatch = await bcrypt.compare(password, file.passwordHash);
            if (passwordMatch) {
                const key = getKeyAndIV(password, Buffer.from(file.salt, 'hex'));
                const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(file.iv, 'hex'));

                const encryptedData = Buffer.from(file.encryptedData, 'hex');
                const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

                // Determine content type (e.g., 'image/png', 'image/jpeg', 'text/plain')
                const extension = file.filename.split('.').pop();
                const contentType = extension === 'png'
                    ? 'image/png'
                    : extension === 'jpeg' || extension === 'jpg'
                    ? 'image/jpeg'
                    : 'text/plain';

                res.setHeader('Content-Disposition', `attachment; filename=${file.filename}`);
                res.setHeader('Content-Type', contentType);

                return res.send(decrypted);
            }
        }

        res.status(404).json({ error: "No file found with matching password" });
    } catch (error) {
        console.error("Error decrypting file:", error);
        res.status(500).json({ error: "Error decrypting file" });
    }
});


// Start the server
const PORT = 5002;
app.listen(PORT, () => {
    console.log(`Password-based encryption server running on http://localhost:${PORT}`);
});

