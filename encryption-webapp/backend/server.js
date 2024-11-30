const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer'); // Import Nodemailer

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(fileUpload());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

// Encryption Configuration
const algorithm = 'aes-256-cbc';

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'adeentaquie2002@gmail.com', // Replace with your Gmail address
        pass: 'cgjq wtdd xzvg dvcm', // Replace with your app password
    },
});

// Encryption Function for Binary Data
function encryptBinary(data, key, iv) {
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    return encrypted;
}

// Decryption Function for Binary Data
function decryptBinary(encryptedData, key, iv) {
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return decrypted;
}

// Encryption Route
app.post('/upload', (req, res) => {
    const key = crypto.randomBytes(32).toString('hex');
    const iv = crypto.randomBytes(16).toString('hex');
    const file = req.files?.file;

    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = path.join(__dirname, 'uploads', file.name);

    file.mv(filePath, (err) => {
        if (err) {
            return res.status(500).send('File upload failed.');
        }

        try {
            const data = fs.readFileSync(filePath);
            const encryptedData = encryptBinary(data, key, iv);
            const encryptedFilePath = `${filePath}.enc`;

            fs.writeFileSync(encryptedFilePath, encryptedData);
            console.log('Encrypted file path:', encryptedFilePath);

            res.send({
                message: 'File encrypted successfully!',
                downloadLink: `/download?file=${path.basename(encryptedFilePath)}`,
                key: key,
                iv: iv,
                filePath: path.basename(encryptedFilePath),
            });
        } catch (error) {
            res.status(500).send('Encryption failed: ' + error.message);
        }
    });
});

// Decryption Route
app.post('/decrypt', (req, res) => {
    const { key, iv } = req.body;
    const file = req.files?.file;

    if (!key || !iv) {
        return res.status(400).send('Missing key or IV.');
    }
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = path.join(__dirname, 'uploads', file.name);

    file.mv(filePath, (err) => {
        if (err) {
            return res.status(500).send('File upload failed.');
        }

        try {
            const encryptedData = fs.readFileSync(filePath);
            const decryptedData = decryptBinary(encryptedData, key, iv);
            const decryptedFilePath = filePath.replace('.enc', '-decrypted');

            fs.writeFileSync(decryptedFilePath, decryptedData);
            console.log('Decrypted file path:', decryptedFilePath);

            res.send({
                message: 'File decrypted successfully!',
                downloadLink: `/download?file=${path.basename(decryptedFilePath)}`,
            });
        } catch (error) {
            res.status(500).send('Decryption failed: ' + error.message);
        }
    });
});

// Email Route to Send the Encrypted File with Key and IV
app.post('/send-email', (req, res) => {
    const { recipientEmail, filePath, key, iv } = req.body;

    if (!recipientEmail || !filePath || !key || !iv) {
        return res.status(400).send('Missing recipient email, file path, key, or IV.');
    }

    const fullFilePath = path.join(__dirname, 'uploads', filePath);

    if (!fs.existsSync(fullFilePath)) {
        return res.status(404).send('File not found.');
    }

    const mailOptions = {
        from: 'adeentaquie2002@gmail.com',
        to: recipientEmail,
        subject: 'Encrypted File with Key and IV',
        text: `Please find the encrypted file attached.

Encryption Details:
- Key: ${key}
- Initialization Vector (IV): ${iv}

Save these details securely, as you will need them for decryption.`,
        attachments: [
            {
                path: fullFilePath,
            },
        ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Email send error:', error.message);
            return res.status(500).send('Failed to send email.');
        }
        console.log('Email sent:', info.response);
        res.send('Email sent successfully with key and IV!');
    });
});

// Download Route
app.get('/download', (req, res) => {
    const fileName = req.query.file;
    const filePath = path.join(__dirname, 'uploads', fileName);

    if (fs.existsSync(filePath)) {
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).send('File download failed.');
            }
        });
    } else {
        console.error('File not found:', filePath);
        res.status(404).send('File not found.');
    }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
