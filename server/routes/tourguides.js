const express = require('express')
const Tourguide = require('../models/tourguide')
const auth = require('../middleware/auth')
const multer = require('multer')
const crypto = require('crypto-browserify')
const path = require('path')
const fs = require('fs')
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

// Upload tourguide profile image
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
  destination: './server/public/img/',
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
    const avatar = req.tourguide.avatar
    const tourguide = req.tourguide
    tourguide['avatar'] = req.file.filename
    await tourguide.save()
    setTimeout(() => {
      res.send(tourguide)
      if (avatar != '37fa4d5d0a9260b4cfae2eef989d51bf1620687131345.jpeg') {
        fs.unlinkSync(`./server/public/img/${avatar}`)
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

// Delete tourguide avatar
router.delete('/deleteimage', auth, async (req, res) => {
  try {
    const avatar = req.tourguide.avatar
    const tourguide = req.tourguide
    if (avatar == '37fa4d5d0a9260b4cfae2eef989d51bf1620687131345.jpeg') {
      res.send(tourguide)
      return
    }
    tourguide['avatar'] = '37fa4d5d0a9260b4cfae2eef989d51bf1620687131345.jpeg'
    await tourguide.save()
    fs.unlinkSync(`./server/public/img/${avatar}`)
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