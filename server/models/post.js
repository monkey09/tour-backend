const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
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

postSchema.virtual('comment', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post'
})

const Post = mongoose.model('Post', postSchema)

module.exports = Post