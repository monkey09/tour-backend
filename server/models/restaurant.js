const mongoose = require('mongoose')

const restaurantSchema = new mongoose.Schema({
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

const Restautant = mongoose.model('Restautant', restaurantSchema)

module.exports = Restautant