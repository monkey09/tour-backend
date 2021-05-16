const mongoose = require('mongoose')

const newSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  title: {
    type: String,
    trim: true,
    required: true
  },
  description: {
    type: String,
    trim: true,
    required: true
  }
}, {
  timestamps: true
})

const New = mongoose.model('New', newSchema)

module.exports = New