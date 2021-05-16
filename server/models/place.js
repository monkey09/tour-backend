const mongoose = require('mongoose')

const placeSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  name: {
    type: String,
    trim: true,
    required: true
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

// Tour location
placeSchema.virtual('tour', {
  ref: 'Tour',
  localField: '_id',
  foreignField: 'location'
})

const Place = mongoose.model('Place', placeSchema)

module.exports = Place