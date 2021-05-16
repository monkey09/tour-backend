const mongoose = require('mongoose')

const transportationSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    trim: true,
    default: 0
  },
  description: {
    type: String,
    trim: true,
    required: true
  }
}, {
  timestamps: true
})

const Transportation = mongoose.model('Transportation', transportationSchema)

module.exports = Transportation