const express = require('express')
const Restaurant = require('../models/restaurant')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const crypto = require('crypto-browserify')
const path = require('path')
const fs = require('fs')
const router = new express.Router()

// Get restaurants
router.get('/', auth, async (req, res) => {
  try {
    const restaurants = await Restaurant.find({}).sort({createdAt: 'desc'})
    if (!restaurants) return res.status(404).send()
    res.send(restaurants)
  } catch (e) {
    res.status(500).send()
  }
})

//Get count
router.get('/count', auth, async (req, res) => {
  try {
    const count = await Restaurant.countDocuments({})
    res.send({ count })
  } catch (e) {
    res.status(500).send()
  }
})

// Get restaurant
router.get('/:id', auth, async (req, res) => {
  const _id = req.params.id
  try {
    const restaurant = await Restaurant.findById(_id)
    res.send(restaurant)
  } catch (e) {
    res.status(404).send()
  }
})

// Upload restaurant image
const fileFilter = function (req, file, cb) {
  const allowedTypes = ['image/jpg', 'image/png', 'image/jpeg']
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error("Wrong file type!")
    error.code = "LIMIT_FILE_TYPES"
    return cb(error, false)
  }
  cb(null, true)
}

// Detetmine the distenation and the image name
const MAX_SIZE = 2000000
const storage = multer.diskStorage({
  destination: './client/src/assets/restaurants/',
  filename: async function (req, file, cb){
    await crypto.pseudoRandomBytes(16, function (err, raw) {
      cb(null, raw.toString('hex') + Date.now() + path.extname(file.originalname))
    })
  }
})

// Initiate multer
const upload = multer({
  storage: storage,
  fileFilter,
  limits: {
    fileSize: MAX_SIZE
  }
})

// Add restaurant
router.post('/', auth, upload.single("file"), async (req, res) => {
  try {
    const availability = []
    req.body.availability.forEach(ava => {
      availability.push({ 'option': ava })
    })
    const restaurant = new Restaurant({
      'image': req.file.filename,
      'name': req.body.name,
      'availability': availability,
      'location': req.body.location,
      'description': req.body.description
    })
    await restaurant.save()
    setTimeout(() => {
      res.status(200).send()
    }, 1000)
  } catch (e) {
    res.status(500).send()
  }
})

// Limit type and size of the image
router.use(function(err, req, res, next) {
  if (err.code === "LIMIT_FILE_TYPES") {
    res.status(422).send()
    return
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(422).send()
    return
  }
})

// Delete restaurant
router.delete('/:id', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id)
    const users = await User.find({ 'restaurant.restaurantId': req.params.id })
    users.forEach(async user => {
      user['restaurant.restaurantId'] = '0'
      user['restaurant.reservation'] = '0'
      await user.save()
    })
    fs.unlinkSync(`./client/src/assets/restaurants/${restaurant.image}`)
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})



module.exports = router