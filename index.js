
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')


// MONGO_URI=mongodb+srv://dhanushch3:6301580665@cluster0.byg2l.mongodb.net/dhanushch3db?retryWrites=true&w=majority&appName=Cluster0
// "mongodb://localhost:27017/meetings"

const app = express()
const userRouter = require('./routes/userRoute.js')
const eventRouter = require('./routes/eventRoute.js')
app.use(express.json())
app.set('trust proxy', 1);

const allowedOrigins = [
    
    'https://meetings-frontend-k91x-dhanushch123s-projects.vercel.app',
    'https://meetings-frontend-1jh4-dhanushch123s-projects.vercel.app',
    'http://localhost:5173'
  ];
  
  app.use(cors({
    origin: function (origin, callback) {
   
      if (!origin) return callback(null, true);
  
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));

app.use(cookieParser())
app.use(express.urlencoded({extended : true}))



app.use('/user',userRouter)
app.use('/event',eventRouter)






const {db} = require('./helper/setup.js')





app.listen(process.env.PORT,()=>{
    console.log(`app is running on http://localhost:${process.env.PORT}`)
})
