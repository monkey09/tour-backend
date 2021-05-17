const express = require('express')
const Pharmacy = require('../models/pharmacy')
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

// Get pharmacies
router.get('/', auth, async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find({}).sort({createdAt: 'desc'})
    if (!pharmacies) return res.status(404).send()
    res.send(pharmacies)
  } catch (e) {
    res.status(500).send()
  }
})

//Get count
router.get('/count', auth, async (req, res) => {
  try {
    const count = await Pharmacy.countDocuments({})
    res.send({ count })
  } catch (e) {
    res.status(500).send()
  }
})

// add pharmacy with image
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
    const pharmacy = new Pharmacy({
      'image': result.secure_url,
      'name': req.body.name,
      'location': req.body.location,
      'description': req.body.description,
      'contacts': req.body.contacts
    })
    await pharmacy.save()
    res.send(pharmacy)
  }  
  upload(req)
})

// Delete pharmacy
router.delete('/:id', auth, async (req, res) => {
  try {
    await Pharmacy.findByIdAndDelete(req.params.id)
    res.status(200).send()
  } catch (e) {
    res.status(500).send()
  }
})



module.exports = router