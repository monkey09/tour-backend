const express = require('express')
const Admin = require('../models/admin')
const auth = require('../middleware/auth')
const multer = require('multer')
const crypto = require('crypto-browserify')
const path = require('path')
const fs = require('fs')
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
    const avatar = req.admin.avatar
    const admin = req.admin
    admin['avatar'] = req.file.filename
    await admin.save()
    setTimeout(() => {
      res.send(admin)
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

// Delete admin avatar
router.delete('/deleteimage', auth, async (req, res) => {
  try {
    const avatar = req.admin.avatar
    const admin = req.admin
    if (avatar == '37fa4d5d0a9260b4cfae2eef989d51bf1620687131345.jpeg') {
      res.send(admin)
      return
    }
    admin['avatar'] = '37fa4d5d0a9260b4cfae2eef989d51bf1620687131345.jpeg'
    await admin.save()
    fs.unlinkSync(`./client/src/assets/profiles/${avatar}`)
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