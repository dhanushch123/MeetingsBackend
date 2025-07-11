
const jwt = require('jsonwebtoken')

const verifyToken = (request,response,next)=>{
   

    const token = request.cookies.token
    
    if(!token) 
    {
        return response.status(403).json({message : "Access denied",status : 403})
    }
    try{
      
        const decoded = jwt.verify(token,process.env.SECRET_KEY)
        request.user = decoded;

        
        next()
    }
    catch(err)
    {
        console.log("currently not logged in")
        return response.status(400).json({message : err.message,status : 400})
    }
}

module.exports = {verifyToken}