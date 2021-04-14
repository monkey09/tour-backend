const express = require('express')
const cors = require('cors')
require('./db/mongoose')
const app = express()

app.use(cors())

const posts = require('./routes/posts')
app.use('/posts', posts)

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`Server started on port ${port}`))

