const express = require('express')
const Comment = require('../models/comment')
const Post = require('../models/post')
const auth = require('../middleware/auth')
const router = new express.Router()

// Get all comments for admin
router.get('/', auth, async (req, res) => {
  try {
    const comments = await Comment.find({}).sort({createdAt: 'desc'}).populate('owner')
    res.send(comments)
  } catch (e) {
    res.status(500).send()
  }
})

// Get comments for post
router.get('/:id', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ 'post': req.params.id }).sort({createdAt: 'desc'}).populate('owner')
    if (!comments) return res.status(404).send()
    res.send(comments)
  } catch (e) {
    res.status(500).send()
  }
})

// Add comment
router.post('/', auth, async (req, res) => {
  let comment = undefined
  if (req.user) {
    comment = new Comment({
      ...req.body,
      'owner': req.user._id,
      'creator': 'User'
    })
  } else if (req.tourguide) {
    comment = new Comment({
      ...req.body,
      'owner': req.tourguide._id,
      'creator': 'Tourguide'
    })
  }
  try {
    await comment.save()
    const post = await Post.findById(req.body.post)
    post.comments = post.comments + 1
    await post.save()
    res.status(200).send()
  } catch (e) {
    res.status(500).send()
  }
})

// Delete comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id)
    const post = await Post.findById(comment.post)
    post.comments = post.comments - 1
    await post.save()
    res.status(200).send()
  } catch (e) {
    res.status(500).send()
  }
})

module.exports = router