const express = require('express')
const Tour = require('../models/tour')
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

// Get tours
router.get('/', auth, async (req, res) => {
  try {
    const tours = await Tour.find({}).sort({createdAt: 'desc'})
    .populate('creator').populate('location').populate('users')
    if (!tours) return res.status(404).send()
    res.send(tours)
  } catch (e) {
    res.status(500).send()
  }
})

// Get guide tours
router.get('/manage', auth, async (req, res) => {
  try {
    const tours = await Tour.find({ creator: req.tourguide._id }).sort({createdAt: 'desc'})
    .populate('location').populate('users')
    if (!tours) return res.status(404).send()
    res.send(tours)
  } catch (e) {
    res.status(500).send()
  }
})

// delete user from tour
router.patch('/deleteuser/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    const tour = await Tour.findById(req.body.tour)
    await tour.shiftUser(user._id)
    user['tour'] = undefined
    await user.save()
    res.send()
  } catch (e) {
    res.status(400).send()
  }
})

// Get guide tours for admin
router.get('/guide/:id', auth, async (req, res) => {
  try {
    const tours = await Tour.find({ creator: req.params.id }).sort({createdAt: 'desc'})
    .populate('location').populate('users').populate('creator')
    res.send(tours)
  } catch (e) {
    res.status(500).send()
  }
})

// Get user tour
router.get('/:id', auth, async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id)
    .populate('creator').populate('location').populate('users')
    if (!tour) return res.status(404).send()
    res.send(tour)
  } catch (e) {
    res.status(500).send()
  }
})

// Get place tours
router.get('/place/:id', auth, async (req, res) => {
  try {
    const tours = await Tour.find({ location: req.params.id }).sort({createdAt: 'desc'})
    .populate('creator')
    if (!tours) return res.status(404).send()
    res.send(tours)
  } catch (e) {
    res.status(500).send()
  }
})

// add tour with image
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
    const tour = new Tour({
      'title': req.body.title,
      'price': req.body.price,
      'description': req.body.description,
      'location': req.body.location,
      'image': result.secure_url,
      'creator': req.tourguide._id,
    })
    await tour.save()
    res.send(tour)
  }  
  upload(req)
})


// Delete tour
router.delete('/deletetour/:id', async (req, res) => {
  try {
    const users = await User.find({ 'tour': req.params.id })
    users.forEach(async user => {
      user['tour'] = undefined
      await user.save()
    })
    await Tour.findByIdAndDelete(req.params.id)
    res.status(200).send()
  } catch (e) {
    res.status(500).send()
  }
})



module.exports = router