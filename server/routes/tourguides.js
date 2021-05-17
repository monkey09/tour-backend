const express = require('express')
const Tourguide = require('../models/tourguide')
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

// Signup tourguide
router.post('/', async (req, res) => {
  const tourguide = new Tourguide(req.body)
  try {
    await tourguide.save()
    res.status(201).send()
  } catch (e) {
    res.status(400).send()
  }
})

// Login tourguide
router.post('/login', async (req, res) => {
  try {
    const tourguide = await Tourguide.findByCredentials(req.body.email, req.body.password)
    const token = await tourguide.generateToken()
    res.send({ token })
  } catch (e) {
    res.status(404).send()
  }
})

// Get me
router.get('/me', auth, async (req, res) => {
  try {
    res.send(req.tourguide)
  } catch (e) {
    res.status(500).send()
  }
})

// Like post
router.patch('/like/:id', auth, async (req, res) => {
  const tourguide = req.tourguide
  try {
    const response = await tourguide.pushLikes(req.params.id)
    res.status(200).send(response)
  } catch (e) {
    res.status(400).send()
  }
})

// Get tourguides
router.get('/', auth, async (req, res) => {
  try {
    const tourguides = await Tourguide.find({})
    res.send(tourguides)
  } catch (e) {
    res.status(500).send()
  }
})

// Get guide of the month
router.get('/month', auth, async (req, res) => {
  try {
    const tourguides = await Tourguide.find({}).limit(4)
    res.send(tourguides)
  } catch (e) {
    res.status(500).send()
  }
})

// Get tourguide
router.get('/:id', async (req, res) => {
  const _id = req.params.id
  try {
    const tourguide = await Tourguide.findById(_id)
    if (!tourguide) return res.status(404).send()
    res.send(tourguide)
  } catch (e) {
    res.status(500).send()
  }
})

// Upload the image
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
    const tourguide = req.tourguide
    tourguide['avatar'] = result.secure_url
    await tourguide.save()
    res.send(tourguide)
  }  
  upload(req)
})

// Delete tourguide avatar
router.delete('/deleteimage', auth, async (req, res) => {
  try {
    const tourguide = req.tourguide
    tourguide['avatar'] = 'https://res.cloudinary.com/tourists-services/image/upload/v1621157724/bwnum00a1iab3dp3rhjf.jpg'
    await tourguide.save()
    res.send(tourguide)
  } catch (e) {
    res.status(500).send()
  }
})

// Update tourguide
router.patch('/', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'phone', 'password', 'language', 'license']
  const isValidUpdate = updates.every(update => allowedUpdates.includes(update))
  if (!isValidUpdate) return res.status(400).send({ error: 'Invalid Updates!' })
  try {
    const tourguide = req.tourguide
    updates.forEach(update => tourguide[update] = req.body[update])
    await tourguide.save()
    res.send(tourguide)
  } catch (e) {
    res.status(400).send()
  }
})

// Logout tourguide
router.post('/logout', auth, async (req, res) => {
  try {
      req.tourguide.tokens = req.tourguide.tokens.filter(token => {
          return token.token !== req.token
      })
      await req.tourguide.save()
      res.status(200).send()
  } catch (e) {
      res.status(500).send()
  }
})

// Delete tourguide
router.delete('/:id', async (req, res) => {
  try {
    const tourguide = await Tourguide.findByIdAndDelete(req.params.id)
    if (!tourguide) return res.status(404).send()
    res.send(tourguide)
  } catch (e) { 
    res.status(500).send()
  }
})



module.exports = router