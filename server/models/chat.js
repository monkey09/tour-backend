const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true
    }
})

const chat = mongoose.model('chat', chatSchema)

module.exports = chat