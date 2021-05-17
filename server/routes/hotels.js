const express = require('express')
const Hotel = require('../models/hotel')
const User = require('../models/user')
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

// Get hotels
router.get('/', auth, async (req, res) => {
  try {
    const hotels = await Hotel.find({}).sort({createdAt: 'desc'})
    if (!hotels) return res.status(404).send()
    res.send(hotels)
  } catch (e) {
    res.status(500).send()
  }
})

//Get count
router.get('/count', auth, async (req, res) => {
  try {
    const count = await Hotel.countDocuments({})
    res.send({ count })
  } catch (e) {
    res.status(500).send()
  }
})

// Get hotel
router.get('/:id', auth, async (req, res) => {
  const _id = req.params.id
  try {
    const hotel = await Hotel.findById(_id)
    res.send(hotel)
  } catch (e) {
    res.status(404).send()
  }
})

// add hotel with image
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
    const availability = []
    req.body.availability.forEach(ava => {
      availability.push({ 'option': ava })
    })
    const hotel = new Hotel({
      'image': result.secure_url,
      'name': req.body.name,
      'availability': availability,
      'location': req.body.location,
      'description': req.body.description
    })
    await hotel.save()
    res.send(hotel)
  }  
  upload(req)
})

// Delete hotel
router.delete('/:id', auth, async (req, res) => {
  try {
    await Hotel.findByIdAndDelete(req.params.id)
    const users = await User.find({ 'hotel.hotelId': req.params.id })
    users.forEach(async user => {
      user['hotel.hotelId'] = '0'
      user['hotel.reservation'] = '0'
      await user.save()
    })
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})



module.exports = router