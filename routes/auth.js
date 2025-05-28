import express from 'express';
import User from '../models/User.js';
import { sendEmailCode, sendWelcomeEmail, sendResetConfirmation } from '../utils/email.js';

const router = express.Router();
const resetCodes = {};

router.post('/signup', async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'User already exists' });

    const user = await User.create({ name, email, phone, password });
    await sendWelcomeEmail(email, name);

    return res.status(201).json({ message: 'User created and email sent' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});
// routes/auth.js
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // ✅ Check for suspension FIRST
    if (user.suspended) {
      return res.status(403).json({ error: 'Your account is suspended. Contact support.' });
    }

    // ✅ Then check password
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ success: true, email: user.email, name: user.name });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/user-status?email=user@example.com
router.get('/user-status', async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ suspended: user.suspended === true });
  } catch (err) {
    console.error("Error checking user status:", err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/request-reset-code', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  resetCodes[email] = code;
  await sendEmailCode(email, code);
  res.json({ message: 'Reset code sent' });
});
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;

  // Verify reset code
  if (resetCodes[email] !== code)
    return res.status(400).json({ message: 'Invalid code' });

  try {
    // Update password in DB
    const user = await User.findOneAndUpdate(
      { email },
      { password: newPassword },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Clean up used code
    delete resetCodes[email];

    // Send confirmation email
    await sendResetConfirmation(email);

    res.json({ message: 'Password updated and confirmation sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// Basic route to get user details by email (replace with token-based auth in production)
router.get('/user/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
