const User = require('../models/user')
const Tourguide = require('../models/tourguide')
const Admin = require('../models/admin')
const jwt = require('jsonwebtoken')

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '')
    const decoded = jwt.verify(token, 'thisismyKey')
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
    if (!user) {
      const tourguide = await Tourguide.findOne({ _id: decoded._id, 'tokens.token': token })
      if (!tourguide) {
        const admin = await Admin.findOne({ _id: decoded._id, 'tokens.token': token })
        if (!admin) {
          throw new Error()
        } else {
          req.admin = admin
          req.token = token
        }
      } else {
        req.tourguide = tourguide
        req.token = token
      }
    } else {
      req.user = user
      req.token = token
    }
    next()
  } catch (e) {
    res.status(401).send({ error: 'Please authenticate.' })
  }
}

module.exports = auth