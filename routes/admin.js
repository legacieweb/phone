import express from 'express';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Order from '../models/Order.js';

const router = express.Router();

// ✅ Email Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'iyonicorp@gmail.com',
    pass: 'dikfirjarvijwskx' // App password – use environment variable in production
  }
});

// ✅ Send Email When Status Changes
function sendStatusEmail(to, name, product, newStatus) {
  const mailOptions = {
    from: 'PhoneMart <iyonicorp@gmail.com>',
    to,
    subject: `Update on Your Order - ${product}`,
    html: `
      <h3>Hello ${name},</h3>
      <p>Your order for <strong>${product}</strong> has been updated to:</p>
      <p style="font-size:18px"><strong>Status: <span style="color:blue">${newStatus.toUpperCase()}</span></strong></p>
      <p>We’ll notify you about the next step soon.</p>
      <br />
      <p>Thanks for shopping with PhoneMart!</p>
    `
  };

  return transporter.sendMail(mailOptions);
}


// ✅ Get All Users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().lean();
    res.json(users);
  } catch (err) {
    console.error('❌ Error fetching users:', err.message);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// ✅ Get All Orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error('❌ Failed to fetch orders:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ✅ Update Order Status and Notify User
router.put('/order/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    if (!status) {
      return res.status(400).json({ error: "Status is required." });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: "Order not found." });

    // Send notification email
    await sendStatusEmail(order.email, order.name, order.product, status);

    res.status(200).json({ message: `✅ Order updated to '${status}' and user notified.`, order });
  } catch (err) {
    console.error('❌ Failed to update order status:', err.message);
    res.status(500).json({ error: 'Failed to update order status. Please try again.' });
  }
});

// ✅ Suspend or Unsuspend User
router.put('/user/:id/suspend', async (req, res) => {
  const { suspend } = req.body;
  try {
    await User.findByIdAndUpdate(req.params.id, { suspended: suspend });
    res.json({ message: `User has been ${suspend ? 'suspended' : 'unsuspended'}.` });
  } catch (err) {
    console.error("❌ Failed to update suspension:", err.message);
    res.status(500).json({ error: 'Could not update user suspension.' });
  }
});
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Compare with environment variables
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.status(200).json({ success: true });
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

export default router;
