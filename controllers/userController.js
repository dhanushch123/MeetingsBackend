

// we will have user controller functions here 

const bcrypt = require('bcryptjs')
const userModel = require('../models/userModel')
const eventModel = require('../models/eventModel')
const jwt = require('jsonwebtoken')
const {convertTo24Hour, getEvents, sendMail} = require('./eventController.js')




const signup = async (request,response)=>{
    
    try{
        
        let{firstname,lastname,password,email,username,gender} = request.body

        let hashedPassword = await bcrypt.hash(password,12)
        let newuser = new userModel({
            firstname,lastname,email,username,gender,
            password : hashedPassword
        })
        let saveduser = await newuser.save()
        response.status(201).json({message : "user created successfully"})
    }
    catch(err)
    {
        response.status(400).json({message : err.message})
    }
}

const login = async(request,response)=>{
    let{username,password} = request.body
    try{
        response.clearCookie("token")
        let user = await userModel.findOne({username : username})
        
        if(user)
        {
            
            let isMatch = await bcrypt.compare(password,user.password)
            //let isMatch = password == user.password
            if(isMatch)
            {
                let token = jwt.sign({
                    username,
                    id : user._id,
                    email : user.email,
                    firstname : user.firstname,
                    lastname : user.lastname
                },process.env.SECRET_KEY,{expiresIn : "4h"})
                response.cookie("token",token,{
                    httpOnly: true,
                    secure: true,  
                    sameSite: "None" 
                  })

                response.status(200).json({message : "authenticated successfully"})
            }
            else
            {
                response.status(400).json({message : "Invalid Credentials"})
            }
            
        }
        else
        {
            response.status(400).json({message : "Invalid User"})
        }
    }
    catch(err)
    {
        response.status(400).json({message : err.message})
    }
}

let update = async(request,response)=>{
    
    try{
        let user = await userModel.findById(request.params.id)

        let details = request.body
        details.password = await bcrypt.hash(details.password,12)
        Object.assign(user,details)
        await user.save()
        response.status(200).json({message : "Updated Successfully"})
    }
    catch(err)
    {
        response.status(400).json({message : err.message})
    }


}
let getPending = async (request, response) => {
    let id = request.params.id;
    try {
        let user = await userModel.findById(id);
        if (!user) {
            return response.status(404).json({ message: "User not found" });
        }
        console.log("In bookings section")
        let now = new Date();
        now = new Date(now.getTime() + 5.5 * 60 * 60 * 1000) // utc -> indian time
        

        let toPast = []
        let validIds = []

        let pending = await Promise.all(user.pending.map(async (item) => {
            
            let event = await eventModel.findById(item.event);
            
            if (!event) return null; // If event is deleted or missing, skip it

            
            let eventDate = new Date(event.date);
            let { hours, minutes } = convertTo24Hour(event.time, event.meridian);
            eventDate.setHours(hours, minutes, 0, 0);
            let endTime = new Date(eventDate.getTime() + event.duration * 60 * 60 * 1000)
           

            if (endTime < now) {
                
                toPast.push(item);
                console.log(item)
                //console.log(item)
                return null; 
            }

            validIds.push(item)

            
            let members = await Promise.all(
                (event.participants || []).map(async (mail) => {
                    let participant = await userModel.findOne({ email: mail });
                    return participant
                        ? {
                            username: participant.username,
                            firstname: participant.firstname,
                            lastname: participant.lastname,
                            gender: participant.gender
                        }
                        : null;
                })
            );

            return {
                ...event.toObject(),
                status: item.status,
                
                members: members.filter(Boolean) 
            };
        }));

        await userModel.findByIdAndUpdate(user._id,{pending : validIds});

        let arr = user.past.concat(toPast)
        //check for duplicates
        console.log(arr)
        let set = new Set()
        let newPast = []

    

    for(let item of arr){
        
        if(set.has(item.event.toString())){
            
            continue;
        }
        else{
            newPast.push(item)
            set.add(item.event.toString())
        }

    }

    user.past = newPast;
    await userModel.findByIdAndUpdate(user._id, { past: newPast });
        

        response.status(200).json({ pending: pending.filter(Boolean),
            

         }); 
    } catch (err) {
       
        response.status(400).json({ message: err.message });
    }
};



let getPast = async(request,response)=>{
    try{
        
        let userid = request.params.id
    let user = await userModel.findById(userid)

    if (!user.past || user.past.length === 0) {
        return response.status(200).json({ past: [] });
    }

    /*let set = new Set()
    let newPast = []

    

    for(let item of user.past){
        
        if(set.has(item.event.toString())){
            
            continue;
        }
        else{
            newPast.push(item)
            set.add(item.event.toString())
        }

    }

    user.past = newPast;
    await userModel.findByIdAndUpdate(user._id, { past: newPast });
    console.log(newPast)*/

    let past = await Promise.all(
        newPast.map(async(item)=>{
            let evt = await eventModel.findById(item.event)
            // console.log(evt)
            if(!evt) return null;
            let members = await Promise.all(
                evt.participants.map(async(mail)=>{
                    let participant = await userModel.findOne({ email: mail });
                    return participant
                        ? {
                            username: participant.username,
                            firstname: participant.firstname,
                            lastname: participant.lastname,
                            gender: participant.gender
                        }
                        : null;

                })
            )
            return {
                ...evt.toObject(),
                status: item.status,
                members: members.filter(Boolean) 
            };


        })
    )
    past = past.filter(Boolean)
    response.status(200).json({past})
    }
    catch(err)
    {
        
        response.status(400).json({message : err.message})
    }
}

let setStatus = async(request,response)=>{
    let userid = request.user.id
    try
    {
        let user = await userModel.findById(userid)

    let eventid = request.params.id
    let evt = await eventModel.findById(eventid)
    let obj = request.body
    const subject = `You have been invited to join the meeting`;
  
  const text = `
    You have accepted the invitation for the following event:

    Event: ${evt.meetingname}
    Date: ${evt.date}
    Time: ${evt.time} ${evt.meridian}
    Host: ${evt.hostname}
    

    You can join the event using the following link: ${evt.elink}

    Best regards,
    Event Scheduler Team
  `;

    // we have to find the event in pending and update the status 
    for (let i = 0; i < user.pending.length; i++) {
        if (user.pending[i].event.toString() === eventid) {
            Object.assign(user.pending[i], obj);
            if(obj.status == "accepted"){
                await sendMail(user.email,subject,text)
            }
            break;
        }
    }
    
    user.markModified("pending"); 
    await user.save()
    response.status(200).json({message : "set status successfully"})
    }
    catch(err)
    {
        response.status(400).json({message : err.message})
    }
}

let getAvailability = async (request,response)=>{
    
    try{
        let id = request.params.id
        let user = await userModel.findById(id)

        
        

        // we have got the user 

       // we have to return the avialbility

       // lets get events 
       // date and time format for events 2025,10,15,22,30
       // object will be {title : "" ,start : "",end : "",status : " "}

       let set1 = new Set()
    let newPending = []

    

    for(let item of user.pending){
        
        if(set1.has(item.event.toString())){
            
            continue;
        }
        else{
            newPending.push(item)
            set1.add(item.event.toString())
        }

    }

    user.pending = newPending;
    await userModel.findByIdAndUpdate(user._id, { pending: newPending });
       let events = []
       for(let item of newPending)
       {
        let event = await eventModel.findById(item.event)
        if(!event) continue;
        let{time,endTime,meridian,date,meetingname} = event 
        // start will be 12 hr format we need 24 hr format
        let{hours,minutes} = convertTo24Hour(time,meridian)
        hours = Number(hours)
        minutes = Number(minutes)
        let year = Number(date.substring(0,4))
        let month = parseInt(date.substring(5,7))-1
        let day = parseInt(date.substring(8,10))
        // we also have endTime
        let eH = parseInt(endTime.substring(0,2))
        let eM = parseInt(endTime.substring(3,5))
        // we got everything
        let status = item.status
        let obj = {
            title : meetingname,
            start : new Date(year,month,day,hours,minutes),
            end : new Date(year,month,day,eH,eM),
            status

        }
        if(status != "pending")
        {
            events.push(obj)
        }
        


       }

      

       let set = new Set()
       let newPast = []

    

    for(let item of user.past){
        
        if(set.has(item.event.toString())){
            
            continue;
        }
        else{
            newPast.push(item)
            set.add(item.event.toString())
        }

    }

    user.past = newPast;
    await userModel.findByIdAndUpdate(user._id, { past: newPast });
       

       for(let item of newPast){
        let event = await eventModel.findById(item.event)
        if(!event) continue;
        let{time,endTime,meridian,date,meetingname} = event 
        // start will be 12 hr format we need 24 hr format
        let{hours,minutes} = convertTo24Hour(time,meridian)
        hours = Number(hours)
        minutes = Number(minutes)
        let year = Number(date.substring(0,4))
        let month = parseInt(date.substring(5,7))-1
        let day = parseInt(date.substring(8,10))
        // we also have endTime
        let eH = parseInt(endTime.substring(0,2))
        let eM = parseInt(endTime.substring(3,5))
        // we got everything
        let status = "past"
        let obj = {
            title : meetingname,
            start : new Date(year,month,day,hours,minutes),
            end : new Date(year,month,day,eH,eM),
            status

        }
        if(item.status != "pending")
        {
            events.push(obj)
            // console.log(obj)
        }
       }

       
       response.status(200).json({availability : user.availability,
        events
       })
    }
    catch(err)
    {
      
        response.status(400).json({message : err.message})
    }


}

let updateAvailability = async(request,response)=>{
    try{
        let id = request.params.id
        let user = await userModel.findById(id)
        user.availability = request.body.updatedAvailability;
       
        await user.save();

        response.status(200).json({message : "updated availability successful"})
    }
    catch(err)
    {
        
        response.status(400).json({message  : err.message})
    }
}



let removeDuplicates = async(request,response)=>{
    try{
        let id = request.params.id;
     
    let user = await userModel.findById(id);

    // we have remove duplicates from user.past 
    // user.past contains   event    and status 
    let set = new Set()
    let newPast = []

    

    for(let item of user.past){
        
        if(set.has(item.event.toString())){
            
            continue;
        }
        else{
            newPast.push(item)
            set.add(item.event.toString())
        }

    }

    user.past = newPast;
    await user.save()
    response.status(200).json({message : "removed duplicates",past : user.past})
    }
    catch(err){
        response.status(400).json({message : err.message});
    }


}

let logout = async(request,response)=>{
    try{
        
    
        response.clearCookie("token")
        response.status(200).json({message : "logged out successfully",status : 200})

    }
    catch(err){
        response.status(400).json({message : err.message})
    }
}

  




module.exports = {signup,login,update,getPending,setStatus,getPast,getAvailability,updateAvailability,removeDuplicates,logout}

