const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Order = require('../models/Order');

// ✅ Email Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'iyonicorp@gmail.com',
    pass: 'dikfirjarvijwskx' // ✅ Use Gmail App Password (not actual password)
  }
});

async function sendOrderConfirmationEmails(order) {
  // 🧠 Determine the correct payment message
  function formatPaymentMessage(method, cod) {
    const upperMethod = method?.toUpperCase() || 'N/A';

    if (!cod) {
      return `Paid Online via ${upperMethod}`;
    }

    switch (upperMethod) {
      case 'CASH':
        return 'Cash on Delivery';
      case 'CARD':
        return 'Pay on Delivery (Card)';
      case 'MOBILE':
        return 'Pay via Mobile Money on Delivery';
      default:
        return `Pay on Delivery (${upperMethod})`;
    }
  }

  const paymentMessage = formatPaymentMessage(order.paymentMethod, order.paymentOnDelivery);

  const htmlContent = `
    <h2>PhoneMart Order Confirmation</h2>
    <p><strong>Customer Name:</strong> ${order.name}</p>
    <p><strong>Email:</strong> ${order.email}</p>
    <p><strong>Phone:</strong> ${order.phone}</p>
    <p><strong>Product:</strong> ${order.product}</p>
    <p><strong>Price:</strong> $${order.price}</p>

    <h3> Shipping Details</h3>
    <ul>
      <li><strong>Location:</strong> ${order.address}</li>
    </ul>

    <p><strong>Payment Info:</strong> ${paymentMessage}</p>
    <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>

    <br>
    <p>We’ll notify you once your order is shipped.</p>
    <p>Thank you for shopping with <strong>PhoneMart</strong>!</p>
  `;

  // 📧 Email to User
  const userMail = {
    from: 'PhoneMart <iyonicorp@gmail.com>',
    to: order.email,
    subject: 'Your PhoneMart Order Confirmation',
    html: `<h3>Hello ${order.name},</h3>${htmlContent}`
  };

  // 📧 Email to Admin
  const adminMail = {
    from: 'PhoneMart <iyonicorp@gmail.com>',
    to: 'iyonicorp@gmail.com',
    subject: `New Order from ${order.name}`,
    html: htmlContent
  };

  // ✉️ Send both emails
  return Promise.all([
    transporter.sendMail(userMail),
    transporter.sendMail(adminMail)
  ]);
}


// ✅ POST /api/order — Place Order
router.post('/order', async (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    product,
    price,
    image,
    payment: paymentMethod,
    paymentOnDelivery
  } = req.body;

  if (!name || !email || !phone || !address || !product || !price) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const order = new Order({
      name,
      email,
      phone,
      address,
      product,
      price,
      image,
      paymentMethod: paymentMethod || 'not specified',
      paymentOnDelivery: !!paymentOnDelivery,
      status: 'pending',
      createdAt: new Date()
    });

    await order.save();
    await sendOrderConfirmationEmails(order);

    res.status(200).json({
      message: 'Order placed successfully. Confirmation emails sent.'
    });
  } catch (err) {
    console.error('Order placement failed:', err);
    res.status(500).json({ error: 'Server error while placing order.' });
  }
});

// ✅ GET /api/orders?email=...
router.get('/orders', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Missing email query parameter.' });
  }

  try {
    const orders = await Order.find({ email }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error('Failed to fetch orders:', err);
    res.status(500).json({ error: 'Could not retrieve orders.' });
  }
});

module.exports = router;
