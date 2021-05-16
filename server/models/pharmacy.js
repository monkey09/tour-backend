const mongoose = require('mongoose')

const pharmacySchema = new mongoose.Schema({
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
  },
  contacts: {
    type: String,
    trim: true,
    required: true
  },
}, {
  timestamps: true
})

const Pharmacy = mongoose.model('Pharmacy', pharmacySchema)

module.exports = Pharmacy