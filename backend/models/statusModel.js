const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    maxlength: 500,
  },
  media: {
    type: String,
    required: true,
    maxlength: 2048,
  },
}, { timestamps: true });

statusSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

const Status = mongoose.model('Status', statusSchema);

module.exports = Status;
