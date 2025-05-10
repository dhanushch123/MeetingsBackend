const dotenv = require('dotenv')
const mongoose = require('mongoose')

dotenv.config()

const db = mongoose.connect(process.env.URI)
.then(()=>{
    console.log("connection successful")
})
const Authemail = process.env.EMAIL_USER
const Authpassword = process.env.EMAIL_PASS


module.exports = {db,Authemail,Authpassword}

