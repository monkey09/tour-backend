const express = require('express')
const Post = require('../models/post')
const Comment = require('../models/comment')
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

// Get posts
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find({}).sort({createdAt: 'desc'}).populate('owner').limit(10)
    if (!posts) return res.status(404).send()
    res.send(posts)
  } catch (e) {
    res.status(500).send()
  }
})

// Get more posts
router.get('/more/:got', auth, async (req, res) => {
  try {
    const posts = await Post.find({}).sort({createdAt: 'desc'}).populate('owner').skip(parseInt(req.params.got)).limit(10)
    if (!posts) return res.status(404).send()
    res.send(posts)
  } catch (e) {
    res.status(500).send()
  }
})

// Get post
router.get('/onepost/:id', auth, async (req, res) => {
  const _id = req.params.id
  try {
    const post = await Post.findById(_id).populate('owner')
    if (!post) return res.status(404).send()
    res.send(post)
  } catch (e) {
    res.status(404).send()
  }
})

// Get user/tourguide posts
router.get('/myposts', auth, async (req, res) => {
  let posts = undefined
  try {
    if (req.user) {
     posts = await Post.find({ 'owner': req.user._id }).sort({createdAt: 'desc'})
    } else if (req.tourguide) {
     posts = await Post.find({ 'owner': req.tourguide._id }).sort({createdAt: 'desc'})
    }
    if (!posts) res.status(404).send()
    res.send(posts)
  } catch (e) {
    res.status(500).send()
  }
})

// Get user posts for admin
router.get('/adposts/:id', auth, async (req, res) => {
  try {
    const posts = await Post.find({ 'owner': req.params.id })
    res.send(posts)
  } catch (e) {
    res.status(500).send()
  }
})

// add post with image
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
    let post = undefined
    if (req.user) {
      post = new Post({
        'image': result.secure_url,
        'content': req.body.content,
        'owner': req.user._id,
        'creator': 'User'
      })
    } else if (req.tourguide) {
      post = new Post({
        'image': result.secure_url,
        'content': req.body.content,
        'owner': req.tourguide._id,
        'creator': 'Tourguide'
      })
    }
    await post.save()
    res.send(post)
  }  
  upload(req)
})

// Like post
router.patch('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (req.body.alreadyLiked) post.likes = post.likes - 1
    else post.likes = post.likes + 1
    await post.save()
    res.send(post)
  } catch (e) {
    res.status(400).send()
  }
})

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id)
    await Comment.deleteMany({ post: post._id })
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})



module.exports = router