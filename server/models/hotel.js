const mongoose = require('mongoose')

const hotelSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  availability:[{
    option: {
      type: String
    }
  }],
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

const Hotel = mongoose.model('Hotel', hotelSchema)

module.exports = Hotel