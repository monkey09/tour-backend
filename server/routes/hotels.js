const express = require('express')
const Hotel = require('../models/hotel')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const crypto = require('crypto-browserify')
const path = require('path')
const fs = require('fs')
const router = new express.Router()

// Get hotels
router.get('/', auth, async (req, res) => {
  try {
    const hotels = await Hotel.find({}).sort({createdAt: 'desc'})
    if (!hotels) return res.status(404).send()
    res.send(hotels)
  } catch (e) {
    res.status(500).send()
  }
})

//Get count
router.get('/count', auth, async (req, res) => {
  try {
    const count = await Hotel.countDocuments({})
    res.send({ count })
  } catch (e) {
    res.status(500).send()
  }
})

// Get hotel
router.get('/:id', auth, async (req, res) => {
  const _id = req.params.id
  try {
    const hotel = await Hotel.findById(_id)
    res.send(hotel)
  } catch (e) {
    res.status(404).send()
  }
})

// Upload hotel image
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
  destination: './client/src/assets/hotels/',
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

// Add hotel
router.post('/', auth, upload.single("file"), async (req, res) => {
  try {
    const availability = []
    req.body.availability.forEach(ava => {
      availability.push({ 'option': ava })
    })
    const hotel = new Hotel({
      'image': req.file.filename,
      'name': req.body.name,
      'availability': availability,
      'location': req.body.location,
      'description': req.body.description
    })
    await hotel.save()
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

// Delete hotel
router.delete('/:id', auth, async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id)
    const users = await User.find({ 'hotel.hotelId': req.params.id })
    users.forEach(async user => {
      user['hotel.hotelId'] = '0'
      user['hotel.reservation'] = '0'
      await user.save()
    })
    fs.unlinkSync(`./client/src/assets/hotels/${hotel.image}`)
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})



module.exports = router