const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const getLogoDataUri = () => {
  try {
    const logoPath = path.join(__dirname, '../../client/public/favicon.svg');
    const svg = fs.readFileSync(logoPath);
    return `data:image/svg+xml;base64,${svg.toString('base64')}`;
  } catch (err) {
    console.error('Failed to load logo:', err.message);
    return null;
  }
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials not configured');
  }

  // Remove spaces from app password (Google displays with spaces)
  const pass = process.env.EMAIL_PASS.replace(/\s+/g, '');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass
    }
  });

  const info = await transporter.sendMail({
    from: `AllenShores PH <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  });

  return info;
};

module.exports = { sendEmail, getLogoDataUri };
