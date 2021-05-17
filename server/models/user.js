const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
  avatar: {
    type: String,
    default: 'https://res.cloudinary.com/tourists-services/image/upload/v1621157724/bwnum00a1iab3dp3rhjf.jpg'
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minLenght: 3,
    maxLenght: 15
  },
  email: {
    type: String,
    require: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value))
        throw new Error('email is invalid')
    }
  },
  phone: {
    type: String,
    trim: true,
    required: true
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 6,
    validate(value) {
      if (value.toLowerCase().includes('password'))
        throw new Error('password cannot contain "password!"')
    }
  },
  country: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  language: {
    type: String,
    required: true,
    trim: true
  },
  likedPosts: [{
    likedPost: {
      type: String
    }
  }],
  hotel: {
    hotelId: {
      type: String,
      default: 0
    },
    reservation: {
      type: String,
      default: 0
    },
  },
  restaurant: {
    restaurantId: {
      type: String,
      default: 0
    },
    reservation: {
      type: String,
      default: 0
    },
  },
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour'
  },
  tokens: [{
    token: {
      type: String,
      default: undefined
    }
  }]
}, {
  timestamps: true
})

// Return user brief information
// userSchema.methods.toJSON = function () {
//   const user = this
//   const userObject = user.toObject()

//   delete userObject.tokens
//   delete userObject.password
  
//   return userObject
// }

// Post creator
userSchema.virtual('post', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'owner'
})

// Contact owner
userSchema.virtual('contact', {
  ref: 'Contact',
  localField: '_id',
  foreignField: 'creator'
})

// Generate tokens
userSchema.methods.generateToken = async function () {
  const user = this
  const token = jwt.sign({ _id: user._id.toString() }, 'thisismyKey')
  user.tokens = user.tokens.concat({ token })
  await user.save()
  return token
}

// like posts
userSchema.methods.pushLikes = async function (id) {
  const user = this
  let alreadyLiked = user.likedPosts.some(post => {
    return post.likedPost == id
  })
  if (alreadyLiked) {
    user.likedPosts = user.likedPosts.filter(liked => {
      return liked.likedPost !== id
    })
  } else {
    user.likedPosts = user.likedPosts.concat({ likedPost: id })
  }
  await user.save()
  return { user, alreadyLiked }
}

// Loging user be credentials
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email })
  if (!user) throw new Error('Unable to login!')
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) throw new Error('Unable to login!')
  return user
}

// Hash plain text password before save
userSchema.pre('save', async function (next) {
  const user = this

  if (user.isModified('password'))
    user.password = await bcrypt.hash(user.password, 8)

  next()
})

const User = mongoose.model('User', userSchema)

module.exports = User