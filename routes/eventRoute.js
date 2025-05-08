const express = require('express')

const eventRouter = express.Router()
const{firstpage,create,getEvents, setStatus,remove,updevent} = require('../controllers/eventController.js')
const{verifyToken} = require('../middlewares/middleware.js')

eventRouter.get('/',verifyToken,firstpage)

eventRouter.post('/create',verifyToken,create)

eventRouter.get('/getEvents',verifyToken,getEvents)

eventRouter.put('/status/:id',verifyToken,setStatus)

eventRouter.delete('/remove/:id',verifyToken,remove)

eventRouter.put('/updevent/:id',verifyToken,updevent)

//eventRouter.put('/setStatus/:id',verifyToken,setStatus)

// we have to delete an event




 


module.exports = eventRouter