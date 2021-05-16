const express = require('express')
const New = require('../models/new')
const auth = require('../middleware/auth')
const multer = require('multer')
const crypto = require('crypto-browserify')
const path = require('path')
const fs = require('fs')
const router = new express.Router()

// Get news
router.get('/', auth, async (req, res) => {
  try {
    const news = await New.find({}).sort({createdAt: 'desc'})
    if (!news) return res.status(404).send()
    res.send(news)
  } catch (e) {
    res.status(500).send()
  }
})

// Get brief
router.get('/brief', auth, async (req, res) => {
  try {
    const news = await New.find({}).sort({createdAt: 'desc'}).limit(5)
    res.send(news)
  } catch (e) {
    res.status(500).send()
  }
})

//Get count
router.get('/count', auth, async (req, res) => {
  try {
    const count = await New.countDocuments({})
    res.send({ count })
  } catch (e) {
    res.status(500).send()
  }
})

// Upload news image
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
  destination: './client/src/assets/news/',
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

// Add new
router.post('/', auth, upload.single("file"), async (req, res) => {
  try {
    const news = new New({
      'image': req.file.filename,
      'title': req.body.title,
      'description': req.body.description
    })
    await news.save()
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

// Delete new
router.delete('/:id', auth, async (req, res) => {
  try {
    const oneNew = await New.findByIdAndDelete(req.params.id)
    fs.unlinkSync(`./client/src/assets/news/${oneNew.image}`)
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})



module.exports = router