const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Post'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'creator'
  },
  creator: {
    type: String,
    required: true,
    enum: ['User', 'Tourguide']
  }
}, {
  timestamps: true
})

const Comment = mongoose.model('Comment', commentSchema)

module.exports = Comment