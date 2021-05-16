const express = require('express')
const User = require('../models/user')
const Tourguide = require('../models/tourguide')
const Tour = require('../models/tour')
const auth = require('../middleware/auth')
const multer = require('multer')
const crypto = require('crypto-browserify')
const path = require('path')
const fs = require('fs')
const router = new express.Router()

// Signup user
router.post('/', async (req, res) => {
  const user = new User(req.body)
  try {
    await user.save()
    res.status(201).send()
  } catch (e) {
    res.status(400).send()
  }
})

// Login user
router.post('/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password)
    const token = await user.generateToken()
    res.send({ user:true, token })
  } catch (e) {
    try {
      const tourguide = await Tourguide.findByCredentials(req.body.email, req.body.password)
      const token = await tourguide.generateToken()
      res.send({ tourguide:true, token })
    } catch (e) {
      res.status(404).send()
    }
  }
})

// Get me
router.get('/me', auth, async (req, res) => {
  try {
    res.send(req.user)
  } catch (e) {
    res.status(500).send()
  }
})

// Like post
router.patch('/like/:id', auth, async (req, res) => {
  const user = req.user
  try {
    const response = await user.pushLikes(req.params.id)
    res.status(200).send(response)
  } catch (e) {
    res.status(400).send()
  }
})

// Reserve hotel
router.post('/hotel', auth, async (req, res) => {
  try {
    const user = req.user
    user['hotel'] = req.body['hotel']
    await user.save()
    res.send(user)
  } catch (e) {
    res.status(400).send()
  }
})

// Reserve restaurant
router.post('/restaurant', auth, async (req, res) => {
  try {
    const user = req.user
    user['restaurant'] = req.body['restaurant']
    await user.save()
    res.send(user)
  } catch (e) {
    res.status(400).send()
  }
})

// Join tour
router.post('/jointour/:id', auth, async (req, res) => {
  try {
    const user = req.user
    if (user.tour) {
      const oldTour = await Tour.findById(user.tour)
      await oldTour.shiftUser(user._id)
    }
    user['tour'] = req.params.id
    const tour = await Tour.findById(req.params.id) 
    await tour.pushUser(user._id)
    await user.save()
    res.send(user)
  } catch (e) {
    res.status(400).send()
  }
})

// Unjoin tour
router.post('/unjointour', auth, async (req, res) => {
  try {
    const user = req.user
    const tour = await Tour.findById(user.tour)
    await tour.shiftUser(user._id)
    user['tour'] = undefined
    await user.save()
    res.send(user)
  } catch (e) {
    res.status(400).send()
  }
})

// Get users
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({})
    res.send(users)
  } catch (e) {
    res.status(500).send()
  }
})

// Get tour users
router.get('/tourusers/:id', auth, async (req, res) => {
  try {
    const users = await User.find({ tour: req.params.id })
    res.send(users)
  } catch (e) {
    res.status(500).send()
  }
})

// Get user
router.get('/:id', async (req, res) => {
  const _id = req.params.id
  try {
    const user = await User.findById(_id)
    if (!user) return res.status(404).send()
    res.send(user)
  } catch (e) {
    res.status(500).send()
  }
})

// Upload user profile image
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
  destination: './client/src/assets/profiles/',
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

// Upload the image
router.post('/uploadimage', auth, upload.single("file"), async (req, res) => {
  try {
    const avatar = req.user.avatar
    const user = req.user
    user['avatar'] = req.file.filename
    await user.save()
    setTimeout(() => {
      res.send(user)
      if (avatar != '37fa4d5d0a9260b4cfae2eef989d51bf1620687131345.jpeg') {
        fs.unlinkSync(`./client/src/assets/profiles/${avatar}`)
      }
    }, 1000)
  } catch (e) {
    res.status(400).send()
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

// Delete user avatar
router.delete('/deleteimage', auth, async (req, res) => {
  try {
    const avatar = req.user.avatar
    const user = req.user
    if (avatar == '37fa4d5d0a9260b4cfae2eef989d51bf1620687131345.jpeg') {
      res.send(user)
      return
    }
    user['avatar'] = '37fa4d5d0a9260b4cfae2eef989d51bf1620687131345.jpeg'
    await user.save()
    fs.unlinkSync(`./client/src/assets/profiles/${avatar}`)
    res.send(user)
  } catch (e) {
    res.status(500).send()
  }
})

// Update User
router.patch('/', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'phone', 'password', 'country', 'language']
  const isValidUpdate = updates.every(update => allowedUpdates.includes(update))
  if (!isValidUpdate) return res.status(400).send({ error: 'Invalid Updates!' })
  try {
    const user = req.user
    updates.forEach(update => user[update] = req.body[update])
    await user.save()
    res.send(user)
  } catch (e) {
    res.status(400).send()
  }
})

// Logout user
router.post('/logout', auth, async (req, res) => {
  try {
      req.user.tokens = req.user.tokens.filter(token => {
          return token.token !== req.token
      })
      await req.user.save()
      res.status(200).send()
  } catch (e) {
      res.status(500).send()
  }
})

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) return res.status(404).send()
    res.send(user)
  } catch (e) { 
    res.status(500).send()
  }
})



module.exports = router