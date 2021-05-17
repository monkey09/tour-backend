const express = require('express')
const Admin = require('../models/admin')
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

// Signup admin
router.post('/', async (req, res) => {
  const admin = new Admin(req.body)
  try {
    await admin.save()
    res.status(201).send()
  } catch (e) {
    res.status(400).send()
  }
})

// Login admin
router.post('/login', async (req, res) => {
  try {
    const admin = await Admin.findByCredentials(req.body.email, req.body.password)
    const token = await admin.generateToken()
    res.send({ token })
  } catch (e) {
    res.status(404).send()
  }
})

// Get me
router.get('/me', auth, async (req, res) => {
  try {
    res.send(req.admin)
  } catch (e) {
    res.status(500).send()
  }
})

// Upload admin profile image
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
    const admin = req.admin
    admin['avatar'] = result.secure_url
    await admin.save()
    res.send(admin)
  }  
  upload(req)
})

// Delete admin avatar
router.delete('/deleteimage', auth, async (req, res) => {
  try {
    const admin = req.admin
    admin['avatar'] = 'https://res.cloudinary.com/tourists-services/image/upload/v1621157724/bwnum00a1iab3dp3rhjf.jpg'
    await admin.save()
    res.send(admin)
  } catch (e) {
    res.status(500).send()
  }
})

// Update Admin
router.patch('/', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'password']
  const isValidUpdate = updates.every(update => allowedUpdates.includes(update))
  if (!isValidUpdate) return res.status(400).send({ error: 'Invalid Updates!' })
  try {
    const admin = req.admin
    updates.forEach(update => admin[update] = req.body[update])
    await admin.save()
    res.send(admin)
  } catch (e) {
    res.status(400).send()
  }
})

// Logout admin
router.post('/logout', auth, async (req, res) => {
  try {
      req.admin.tokens = req.admin.tokens.filter(token => {
          return token.token !== req.token
      })
      await req.admin.save()
      res.status(200).send()
  } catch (e) {
      res.status(500).send()
  }
})


module.exports = router