import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your SMTP provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendWelcomeEmail(email, name) {
  await transporter.sendMail({
    from: `"PhoneMart" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to PhoneMart!",
    html: `<h3>Hi ${name},</h3><p>Thanks for signing up with PhoneMart! We're glad to have you. 📱</p>`
  });
}

export async function sendEmailCode(email, code) {
  await transporter.sendMail({
    from: `"PhoneMart Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Password Reset Code",
    html: `<p>Your verification code is: <strong>${code}</strong></p>`
  });
}

// utils/email.js

export async function sendResetConfirmation(email) {
  await transporter.sendMail({
    from: `"PhoneMart Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Password Was Reset",
    html: `
      <h3>Password Reset Confirmation</h3>
      <p>Your password for <strong>${email}</strong> has been successfully updated.</p>
      <p>If this wasn’t you, please contact us immediately.</p>
    `
  });
}