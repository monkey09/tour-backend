const express = require('express')
const Contact = require('../models/contact')
const auth = require('../middleware/auth')
const router = new express.Router()

// Get contacts
router.get('/', auth, async (req, res) => {
  try {
    const contacts = await Contact.find({ creator: req.user._id }).sort({createdAt: 'desc'})
    res.send(contacts)
  } catch (e) {
    res.status(500).send()
  }
})

// Get contacts for admin
router.get('/:id', auth, async (req, res) => {
  try {
    const messages = await Contact.find({ creator: req.params.id }).sort({createdAt: 'desc'}).populate('creator')
    res.send(messages)
  } catch (e) {
    res.status(500).send()
  }
})

// Add contact
router.post('/', auth, async (req, res) => {
  try {
    req.body['creator'] = req.user._id
    const contact = new Contact(req.body)
    await contact.save()
    res.status(200).send()
  } catch (e) {
    res.status(404).send()
  }
})

// Add answer
router.post('/answer', async (req, res) => {
  try {
    const contact = new Contact({
      'content': req.body.content,
      'creator': req.body.creator,
      'fromAdmin': true
    })
    await contact.save()
    res.status(200).send()
  } catch (e) {
    res.status(500).send()
  }
})

// Delete contact
router.delete('/:id', auth, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id)
    if (!contact) return res.status(404).send()
    res.send(contact)
  } catch (e) {
    res.status(500).send()
  }
})



module.exports = router