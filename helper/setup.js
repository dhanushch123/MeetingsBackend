const dotenv = require('dotenv')
const mongoose = require('mongoose')

dotenv.config()

const db = mongoose.connect(process.env.URI)
.then(()=>{
    console.log("connection successful")
})

module.exports = db

