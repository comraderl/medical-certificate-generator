const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const serverless = require('serverless-http');

const app = express();

// Security Middleware
app.set('trust proxy', 1); // Fixes ERR_ERL_UNEXPECTED_X_FORWARDED_FOR behind Netlify
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Helper to reliably parse body in serverless environment
const parseBody = (req) => {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch(e) { return {}; }
  }
  return req.body || {};
};

const CORRECT_PASSKEY = 'CERTificate';

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests from this IP, please try again later.' }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post('/api/send-email', emailLimiter, async (req, res) => {
  try {
    const body = parseBody(req);
    const { email, certificateBase64, passkey } = body;

    if (!email || !certificateBase64 || !passkey) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    if (passkey !== CORRECT_PASSKEY) {
      return res.status(401).json({ error: 'Invalid Passkey.' });
    }

    const base64Data = certificateBase64.replace(/^data:application\/pdf;base64,/, "");

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

    res.json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

module.exports.handler = serverless(app);
