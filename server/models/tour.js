const mongoose = require('mongoose')

const tourSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Place'
  },
  price: { 
    type: Number,
    default: 0
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Tourguide'
  },
  users: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    validate: [usersLimit, '{PATH} exceeds the limit by 10']
  },
  messages: {
    type: [{
      content: {
        type: String
      },
      userId: {
        type: String
      },
      clock: {
        type: Date,
        default: Date.now()
      }
    }]
  }
}, {
  timestamps: true
})

// Limit users by 10
function usersLimit(val) {
  return val.length <= 10;
}

// Tour tourists
tourSchema.virtual('user', {
  ref: 'User',
  localField: '_id',
  foreignField: 'tour'
})

// Push messages
tourSchema.methods.pushMessage = async function (message, userId) {
  const tour = this
  tour.messages = tour.messages.concat({ content: message , userId })
  await tour.save()
  return
}

// Push users
tourSchema.methods.pushUser = async function (user) {
  const tour = this
  tour.users = tour.users.concat(user)
  await tour.save()
  return
}

// Shift users
tourSchema.methods.shiftUser = async function (user) {
  const tour = this
  tour.messages = tour.messages.filter(message => {
    return message.userId.toString() !== user.toString()
  })
  tour.users = tour.users.filter(tourUser => {
    return tourUser.toString() !== user.toString()
  })
  await tour.save()
  return
}

const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour