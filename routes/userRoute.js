
const express = require('express')

const userRouter = express.Router()
const {signup,login,update,getPending,setStatus,getPast,getAvailability,updateAvailability,removeDuplicates,logout} = require('../controllers/userController.js')
const {verifyToken} = require('../middlewares/middleware.js')


userRouter.post('/signup',signup)

userRouter.post('/login',login)

userRouter.put('/update/:id',update)

userRouter.get('/getPending/:id',getPending)

userRouter.get('/getPast/:id',getPast)

userRouter.put('/setStatus/:id',verifyToken,setStatus)

userRouter.get('/getAvailability/:id',getAvailability)

userRouter.put('/updateAvailability/:id',updateAvailability)

userRouter.put('/removeDuplicates/:id',removeDuplicates)

userRouter.post('/logout',logout)




module.exports = userRouter