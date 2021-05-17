const express = require('express')
const Restaurant = require('../models/restaurant')
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

// Get restaurants
router.get('/', auth, async (req, res) => {
  try {
    const restaurants = await Restaurant.find({}).sort({createdAt: 'desc'})
    if (!restaurants) return res.status(404).send()
    res.send(restaurants)
  } catch (e) {
    res.status(500).send()
  }
})

//Get count
router.get('/count', auth, async (req, res) => {
  try {
    const count = await Restaurant.countDocuments({})
    res.send({ count })
  } catch (e) {
    res.status(500).send()
  }
})

// Get restaurant
router.get('/:id', auth, async (req, res) => {
  const _id = req.params.id
  try {
    const restaurant = await Restaurant.findById(_id)
    res.send(restaurant)
  } catch (e) {
    res.status(404).send()
  }
})

// add restaurant with image
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
    const restaurant = new Restaurant({
      'image': result.secure_url,
      'name': req.body.name,
      'availability': availability,
      'location': req.body.location,
      'description': req.body.description
    })
    await restaurant.save()
    res.send(restaurant)
  }  
  upload(req)
})

// Delete restaurant
router.delete('/:id', auth, async (req, res) => {
  try {
    await Restaurant.findByIdAndDelete(req.params.id)
    const users = await User.find({ 'restaurant.restaurantId': req.params.id })
    users.forEach(async user => {
      user['restaurant.restaurantId'] = '0'
      user['restaurant.reservation'] = '0'
      await user.save()
    })
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})



module.exports = router