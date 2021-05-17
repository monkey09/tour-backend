const express = require('express')
const Transportation = require('../models/transportation')
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

// Get transportations
router.get('/', auth, async (req, res) => {
  try {
    const transportations = await Transportation.find({}).sort({createdAt: 'desc'})
    if (!transportations) return res.status(404).send()
    res.send(transportations)
  } catch (e) {
    res.status(500).send()
  }
})

//Get count
router.get('/count', auth, async (req, res) => {
  try {
    const count = await Transportation.countDocuments({})
    res.send({ count })
  } catch (e) {
    res.status(500).send()
  }
})

// add transportation with image
const fileUpload = multer()
router.post('/', auth, fileUpload.single('file'), function (req, res, next) {
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
    const transportation = new Transportation({
      'image': result.secure_url,
      'name': req.body.name,
      'location': req.body.location,
      'description': req.body.description
    })
    await transportation.save()
    res.send(transportation)
  }  
  upload(req)
})

// Delete transportation
router.delete('/:id', auth, async (req, res) => {
  try {
    await Transportation.findByIdAndDelete(req.params.id)
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})



module.exports = router