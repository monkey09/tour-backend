const express = require('express')
const Post = require('../models/post')
const Comment = require('../models/comment')
const auth = require('../middleware/auth')
const multer = require('multer')
const crypto = require('crypto-browserify')
const path = require('path')
const fs = require('fs')
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

// Upload post image
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

// Add post
router.post('/', auth, upload.single("file"), async (req, res) => {
  let post = undefined
  if (req.user) {
    post = new Post({
      'image': req.file.filename,
      'content': req.body.content,
      'owner': req.user._id,
      'creator': 'User'
    })
  } else if (req.tourguide) {
    post = new Post({
      'image': req.file.filename,
      'content': req.body.content,
      'owner': req.tourguide._id,
      'creator': 'Tourguide'
    })
  }
  try {
    await post.save()
    setTimeout(() => {
      res.status(200).send()
    }, 1000)
  } catch (e) {
    res.status(500).send()
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
    fs.unlinkSync(`./server/public/img/${post.image}`)
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})



module.exports = router