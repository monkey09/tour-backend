const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const tourguideSchema = new mongoose.Schema({
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
    trim: true
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 7,
    validate(value) {
      if (value.toLowerCase().includes('password'))
        throw new Error('password cannot contain "password!"')
    }
  },
  license: {
    type: String,
    required: true,
    trim: true
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
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true
})

// Post creator
tourguideSchema.virtual('post', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'owner'
})

// Tour creator
tourguideSchema.virtual('tour', {
  ref: 'Tour',
  localField: '_id',
  foreignField: 'tour'
})

// Generate tokens
tourguideSchema.methods.generateToken = async function () {
  const tourguide = this
  const token = jwt.sign({ _id: tourguide._id.toString() }, 'thisismyKey')
  tourguide.tokens = tourguide.tokens.concat({ token })
  await tourguide.save()
  return token
}

// like posts
tourguideSchema.methods.pushLikes = async function (id) {
  const tourguide = this
  let alreadyLiked = tourguide.likedPosts.some(post => {
    return post.likedPost == id
  })
  if (alreadyLiked) {
    tourguide.likedPosts = tourguide.likedPosts.filter(liked => {
      return liked.likedPost !== id
    })
  } else {
    tourguide.likedPosts = tourguide.likedPosts.concat({ likedPost: id })
  }
  await tourguide.save()
  return { tourguide, alreadyLiked }
}

// // Push languages
// tourguideSchema.methods.pushLanguages = async function () {
//   const tourguide = this
//   const language = tourguide.language
//   tourguide.languages = tourguide.languages.concat({ language })
//   await tourguide.save()
//   return language
// }

// Loging Tourguide be credentials
tourguideSchema.statics.findByCredentials = async (email, password) => {
  const tourguide = await Tourguide.findOne({ email })
  if (!tourguide) throw new Error('Unable to login!')
  const isMatch = await bcrypt.compare(password, tourguide.password)
  if (!isMatch) throw new Error('Unable to login!')
  return tourguide
}

// Hash plain text password before save
tourguideSchema.pre('save', async function (next) {
  const tourguide = this

  if (tourguide.isModified('password'))
  tourguide.password = await bcrypt.hash(tourguide.password, 8)

  next()
})

const Tourguide = mongoose.model('Tourguide', tourguideSchema)

module.exports = Tourguide