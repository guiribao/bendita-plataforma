const nodemailer = require('nodemailer');

export const mailClient = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
  }
});



