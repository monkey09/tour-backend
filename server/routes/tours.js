const express = require('express')
const Tour = require('../models/tour')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const crypto = require('crypto-browserify')
const path = require('path')
const fs = require('fs')
const router = new express.Router()

// Get tours
router.get('/', auth, async (req, res) => {
  try {
    const tours = await Tour.find({}).sort({createdAt: 'desc'})
    .populate('creator').populate('location').populate('users')
    if (!tours) return res.status(404).send()
    res.send(tours)
  } catch (e) {
    res.status(500).send()
  }
})

// Get guide tours
router.get('/manage', auth, async (req, res) => {
  try {
    const tours = await Tour.find({ creator: req.tourguide._id }).sort({createdAt: 'desc'})
    .populate('location').populate('users')
    if (!tours) return res.status(404).send()
    res.send(tours)
  } catch (e) {
    res.status(500).send()
  }
})

// delete user from tour
router.patch('/deleteuser/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    const tour = await Tour.findById(req.body.tour)
    await tour.shiftUser(user._id)
    user['tour'] = undefined
    await user.save()
    res.send()
  } catch (e) {
    res.status(400).send()
  }
})

// Get guide tours for admin
router.get('/guide/:id', auth, async (req, res) => {
  try {
    const tours = await Tour.find({ creator: req.params.id }).sort({createdAt: 'desc'})
    .populate('location').populate('users').populate('creator')
    res.send(tours)
  } catch (e) {
    res.status(500).send()
  }
})

// Get user tour
router.get('/:id', auth, async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id)
    .populate('creator').populate('location').populate('users')
    if (!tour) return res.status(404).send()
    res.send(tour)
  } catch (e) {
    res.status(500).send()
  }
})

// Get place tours
router.get('/place/:id', auth, async (req, res) => {
  try {
    const tours = await Tour.find({ location: req.params.id }).sort({createdAt: 'desc'})
    .populate('creator')
    if (!tours) return res.status(404).send()
    res.send(tours)
  } catch (e) {
    res.status(500).send()
  }
})

// Upload tour image
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
  destination: './client/src/assets/tours/',
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

// Add tour
router.post('/', auth, upload.single("file"), async (req, res) => {
  try {
    const tour = new Tour({
      'title': req.body.title,
      'price': req.body.price,
      'description': req.body.description,
      'location': req.body.location,
      'image': req.file.filename,
      'creator': req.tourguide._id,
    })
    await tour.save()
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

// Delete tour
router.delete('/deletetour/:id', async (req, res) => {
  try {
    const users = await User.find({ 'tour': req.params.id })
    users.forEach(async user => {
      user['tour'] = undefined
      await user.save()
    })
    const tour = await Tour.findByIdAndDelete(req.params.id)
    fs.unlinkSync(`./client/src/assets/tours/${tour.image}`)
    res.status(200).send()
  } catch (e) {
    res.status(500).send()
  }
})



module.exports = router