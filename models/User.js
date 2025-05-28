import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
    suspended: { type: Boolean, default: false }  // ✅ add this

}, { timestamps: true });

export default mongoose.model('User', userSchema);
