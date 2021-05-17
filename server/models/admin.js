const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const adminSchema = new mongoose.Schema({
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
  tokens: [{
    token: {
      type: String,
      default: undefined
    }
  }]
}, {
  timestamps: true
})

// Return admin brief information
// adminSchema.methods.toJSON = function () {
//   const admin = this
//   const adminObject = admin.toObject()

//   delete adminObject.tokens
//   delete adminObject.password
  
//   return adminObject
// }

// Generate tokens
adminSchema.methods.generateToken = async function () {
  const admin = this
  const token = jwt.sign({ _id: admin._id.toString() }, 'thisismyKey')
  admin.tokens = admin.tokens.concat({ token })
  await admin.save()
  return token
}

// Loging admin be credentials
adminSchema.statics.findByCredentials = async (email, password) => {
  const admin = await Admin.findOne({ email })
  if (!admin) throw new Error('Unable to login!')
  const isMatch = await bcrypt.compare(password, admin.password)
  if (!isMatch) throw new Error('Unable to login!')
  return admin
}

// Hash plain text password before save
adminSchema.pre('save', async function (next) {
  const admin = this

  if (admin.isModified('password'))
  admin.password = await bcrypt.hash(admin.password, 8)

  next()
})

const Admin = mongoose.model('Admin', adminSchema)

module.exports = Admin