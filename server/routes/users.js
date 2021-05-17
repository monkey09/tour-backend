const express = require('express')
const User = require('../models/user')
const Tourguide = require('../models/tourguide')
const Tour = require('../models/tour')
const auth = require('../middleware/auth')
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
cloudinary.config({
  cloud_name: 'tourists-services',
  api_key: '521318868529862',
  api_secret: 'GtQwqyuIxTKx0Nh-39mDxBmetas',
})
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

const fileUpload = multer()
router.post('/uploadimage', auth, fileUpload.single('file'), function (req, res, next) {
  let streamUpload = (req) => {
    return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream(
        (error, result) => {
          if (result) {
            resolve(result)
          } else {
            reject(error)
          }
        }
      )
      streamifier.createReadStream(req.file.buffer).pipe(stream)
    })
  }
  async function upload(req) {
    let result = await streamUpload(req)
    const user = req.user
    user['avatar'] = result.secure_url
    await user.save()
    res.send(user)
  }  
  upload(req)
})

// Delete user avatar
router.delete('/deleteimage', auth, async (req, res) => {
  try {
    const user = req.user
    user['avatar'] = 'https://res.cloudinary.com/tourists-services/image/upload/v1621157724/bwnum00a1iab3dp3rhjf.jpg'
    await user.save()
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