const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  product: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: '' },

  paymentMethod: { type: String, default: 'not specified' }, // e.g., 'cash', 'mobile', 'card'
  paymentOnDelivery: { type: Boolean, default: false },

  status: {
    type: String,
    enum: [
      'pending',           // Order placed but not yet processed
      'confirmed',         // Admin has acknowledged the order
      'awaiting_delivery', // Packed, ready to go
      'on_the_way',        // En route to customer
      'shipped',           // Delivered to final destination
      'delivered',         // Customer received
      'cancelled'          // Cancelled by admin/user
    ],
    default: 'pending'
  },

  trackingId: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ✅ Auto-update `updatedAt` before each save
orderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
