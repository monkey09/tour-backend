const express = require('express')
const Place = require('../models/place')
const auth = require('../middleware/auth')
const multer = require('multer')
const crypto = require('crypto-browserify')
const path = require('path')
const fs = require('fs')
const router = new express.Router()

// Get places
router.get('/', auth, async (req, res) => {
  try {
    const places = await Place.find({}).sort({createdAt: 'desc'})
    if (!places) return res.status(404).send()
    res.send(places)
  } catch (e) {
    res.status(500).send()
  }
})

//Get count
router.get('/count', auth, async (req, res) => {
  try {
    const count = await Place.countDocuments({})
    res.send({ count })
  } catch (e) {
    res.status(500).send()
  }
})

// Upload place image
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
  destination: './client/src/assets/places/',
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

// Add place
router.post('/', auth, upload.single("file"), async (req, res) => {
  try {
    const place = new Place({
      'image': req.file.filename,
      'name': req.body.name,
      'location': req.body.location,
      'description': req.body.description,
    })
    await place.save()
    setTimeout(() => {
      res.status(200).send()
    }, 1000)
  } catch (e) {
    res.status(404).send()
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

// Delete place
router.delete('/:id', async (req, res) => {
  try {
    const place = await Place.findByIdAndDelete(req.params.id)
    fs.unlinkSync(`./client/src/assets/news/${place.image}`)
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})



module.exports = router