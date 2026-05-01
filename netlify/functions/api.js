const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const serverless = require('serverless-http');

const app = express();

// Security Middleware
app.use(helmet()); // Secures HTTP headers
app.use(cors());
// Increase the payload limit to allow for large Base64 encoded PDFs
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate Limiting to prevent API spam abuse
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 email requests per windowMs
  message: { error: 'Too many emails sent from this IP, please try again after 15 minutes.' }
});

// Create transporter using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post('/api/send-email', emailLimiter, async (req, res) => {
  try {
    const { email, certificateBase64 } = req.body;

    if (!email || !certificateBase64) {
      return res.status(400).json({ error: 'Patient email and certificate are required.' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_16_character_app_password_here') {
      console.error("Missing valid EMAIL_USER or EMAIL_PASS in .env file.");
      return res.status(500).json({ error: 'Server email configuration is missing or incomplete.' });
    }

    // Remove the data URI prefix if it exists
    const base64Data = certificateBase64.replace(/^data:application\/pdf;base64,/, "");

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: `"Clinic Reception" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Medical Certificate",
      text: "Please find your requested medical certificate attached.",
      html: "<b>Please find your requested medical certificate attached.</b>",
      attachments: [
        {
          filename: 'Medical_Certificate.pdf',
          content: base64Data,
          encoding: 'base64',
          contentType: 'application/pdf'
        }
      ]
    });

    console.log("Message sent: %s", info.messageId);

    res.json({ 
      success: true, 
      message: 'Email sent successfully!'
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

// Export the serverless function
module.exports.handler = serverless(app);
