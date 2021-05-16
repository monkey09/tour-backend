const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema({
  content: {
    type: String,
    trim: true,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  fromAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

const Contact = mongoose.model('Contact', contactSchema)

module.exports = Contact