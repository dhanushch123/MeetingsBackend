
const bcrypt = require('bcryptjs')
const{verifyToken} = require('../middlewares/middleware.js')
 const userModel = require('../models/userModel.js')

const eventModel = require('../models/eventModel.js')
const { request } = require('express')

let firstpage = (request,response)=>{
    
    response.status(200).json({message : "this is events page",
        user : request.user,
        status : 200
    })
}


const index = {
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,

};

// will write checkAvailability function

function end(startTime, duration, meridian) {
    let [hour, minute] = startTime.split(":").map(str => parseInt(str, 10));
  
  
    if (meridian.toUpperCase() === "PM" && hour !== 12) {
      hour += 12;
    } else if (meridian.toUpperCase() === "AM" && hour === 12) {
      hour = 0;
    }

    let totalMinutes = hour * 60 + minute + duration * 60;
    let endHour = Math.floor(totalMinutes / 60) % 24;
    let endMinute = totalMinutes % 60;
  

    const endMeridian = endHour >= 12 ? "PM" : "AM";
    endHour = endHour % 12;
    if (endHour === 0) endHour = 12;
  
    const hh = String(endHour).padStart(2, '0');
    const mm = String(endMinute).padStart(2, '0');
  
    return {
      endTime: `${hh}:${mm}`,
      endMeridian
    };
  }


function convertTo24HourFormat(time, meridian) {
    let [hour, minute] = time.split(":").map(str => parseInt(str, 10));
  
    if (meridian.toUpperCase() === "PM" && hour !== 12) {
      hour += 12;
    } else if (meridian.toUpperCase() === "AM" && hour === 12) {
      hour = 0;
    }
  
    let hours = String(hour).padStart(2, '0');
    let mins = String(minute).padStart(2, '0');
    hours = parseInt(hours)
    mins = parseInt(mins)
    return {
        hours,
        mins
    }
  }



async function checkAvailability(availability,time,meridian,duration,day,user,date,eventid,prevdate)
{
    // In availability we will have time slots in 24 hr format
    // we have event time and duration 
    // so we check want event start and event end in 24 hr format]
    if(day == "Sunday")
    {
        return false;
    }

    let{hours : eventStartH,mins : eventStartM} = convertTo24HourFormat(time,meridian)
    // then we have to find event End 
    let{endTime,endMeridian} = end(time,duration,meridian)

    let{hours : eventEndH,mins : eventEndM} = convertTo24HourFormat(endTime,endMeridian)

    let isSlotAvailable = false;

    // we have event start and event end 
    // we have to check slots that exists in day
    const eventStartMin = eventStartH * 60 + eventStartM;
    const eventEndMin = eventEndH * 60 + eventEndM;
    for(slot of availability[index[day]].slots)
    {
        // we have to write the logic here
        // we will have    slot = {start : " ",end : " "}
        if(slot.start.length > 0 && slot.end.length > 0)
        {
            // there exist a time
            // we have to get hours and mins
            let[slotStartH,slotStartM] = slot.start.split(":")
            let[slotEndH,slotEndM] = slot.end.split(":") 
            slotStartH = parseInt(slotStartH)
            slotStartM = parseInt(slotStartM)
            slotEndH = parseInt(slotEndH)   
            slotEndM = parseInt(slotEndM)

            
            const slotStartMin = slotStartH * 60 + slotStartM;
            const slotEndMin = slotEndH * 60 + slotEndM;

            if (eventStartMin >= slotStartMin && eventEndMin <= slotEndMin) {
                isSlotAvailable = true  // exit loop once a a valid slot is found
                break;
            } 

            
        }

    }
    if(!isSlotAvailable)
    {
        return false;
    }
    // we have to go for further checking if isSlotAvailable
    // check for booked 
    // check if any event occupied that slot on that date

    if(eventid && prevdate)
    {
        // here we have to find the event 
        user.booked[prevdate] = user.booked[prevdate].filter((item)=>{
            return item.eventId.toString() != eventid
        })
        // we have removed the event then we have to add new slot


    }


    if(user.booked[date])
    {
        // we will have array of time slots
        // traverse through slots and find colliding
        const bookings = user.booked[date];

        for (let booking of bookings) {
            let [bookStartH, bookStartM] = booking.start.split(":").map(Number);
            let [bookEndH, bookEndM] = booking.end.split(":").map(Number);

            const bookStartMin = bookStartH * 60 + bookStartM;
            const bookEndMin = bookEndH * 60 + bookEndM;

            // Check for overlap
            const isOverlapping = !(eventEndMin <= bookStartMin || eventStartMin >= bookEndMin);

            if (isOverlapping) {
                return false; // Slot collides with already booked event
            }
        }

        // No overlap found, so we can book this slot

        // for updating event 
        // ther may be change in date start time and end Time
        // so we have to edit carefully
        user.booked[date].push({
            start: `${eventStartH}:${eventStartM}`,
            end: `${eventEndH}:${eventEndM}`,
        });
        user.markModified('booked')
        await user.save()
        

        return true;
    }
    else
    {
        user.booked[date] = [{start : `${eventStartH}:${eventStartM}`,end : `${eventEndH}:${eventEndM}`}]
        // will have 24 hr format
        user.markModified('booked')
        await user.save()
        
        return true;
    }





}



let create = async(request,response)=>{
    let{eventtopic,hostname,description,password,date,time,meridian,duration,elink,participants,day,meetingname,owner,month,zone,color,endTime} = request.body
    // we will get participants as email array
    // so we have to create go through mails and add events in pending meeting field
    //console.log(duration)

   


    try{
        
        // we have to save event only based on availability
       


        let user = await userModel.findById(owner)
        // we get availability
        // we will have a funtion
        let isAvailable = await checkAvailability(user.availability,time,meridian,duration,day,user,date)

        if(!isAvailable)
        {
            return response.status(400).json({message : "user not avilable",
                status : 111
            })
        }

    

       
        

       

        

        let newevent = new eventModel({
            eventtopic,hostname,description,password,date,time,meridian,duration,elink,participants,day,meetingname,owner,month,zone,color,endTime
        })

        


        let event = await newevent.save()

        // we have got the event will update user.booked

        // we have date we check the slots

        for (let i = 0; i < user.booked[date].length; i++) {
            const slot = user.booked[date][i];
            if (!slot.eventId) {
            user.booked[date][i] = { ...slot, eventId: event._id };
            break;
           }
        }

        user.markModified('booked')
        await user.save()

        // also when an event is deleted we have to delete that slot
        

       

        
        
        
        // we are having mails now
        // console.log(participants)
        await Promise.all(
            participants.map(async (item) => {
                let part = await userModel.findOne({ email: item });

              
                if (part) {
                    part.pending.push({event :  event._id,status : "pending"});
                   
                    await part.save(); // Save the updated user
                }
            })
        );
        let og = await userModel.findById(owner);
        if (og) {
            og.upcoming.push(event._id);
            
            await og.save(); // Save the updated owner
        }


        response.status(201).json({message : "event created successfully"})
    }
    catch(err)
    {
        
        response.status(400).send({message : err.message})
    }
}

async function isConflict(event1, pending) {
   // event1 will have all details with id time and duration
   // pending will have event id and status 
   let acceptedIds = pending.filter((item)=>{
    return item.status == "accepted"
    }).map((item)=>{
    return item.event
    })
    
    if(acceptedIds.length == 0)
    {
        return false;
        // no conflict
    }
    // we have got acceptedIds
    // we need to get event object for date and time details
    let acceptedEvents = await Promise.all(acceptedIds.map(async(item)=>{
        let evt = await eventModel.findById(item)
        return evt
    }))

    // now we have event   and upcoming events

    // we have to calculate and start and end time for the respective events and find conflict
    function convertToMinutes(time, meridian) {
        let [hours, minutes] = time.split(":").map(Number);
        if (meridian === "PM" && hours !== 12) hours += 12;
        if (meridian === "AM" && hours === 12) hours = 0;
        return hours * 60 + minutes;
    }
    // calculate no.of minutes  from midninght 
    // like 8:00   duration = 1 
    // start = 8*60 = 480 minutes from midnight(day start)
    // end = start + duration*60 = 480 + 1*60 = 540 min from midnight

    const event1Start = convertToMinutes(event1.time, event1.meridian);
    const event1End = event1Start + parseInt(event1.duration) * 60;

    for(evt of acceptedEvents)
    {
        if(evt.date == event1.date)
        {
            // same dat check for conflict of timing
            let evtstart = convertToMinutes(evt.time,evt.meridian)
            let evtend = evtstart + parseInt(evt.duration) * 60

            if(event1Start < evtend && evtstart < event1End)
            {
                return true;//conflict exists
                // evtstart = 2:30 pm 1.5 hr e1start = 870  e1end = 960   4:00pm
                //  3:30pm 1 hr = e2start = 930  e2end = 990   4:30pm
                // by seeing we can there exist conflict
                // e1start < e2end(870 < 990) chance of having conflict
                // e2start < e1end(930 < 960)
 
            }

        }
    }
    return false;



}

function convertTo24Hour(time, meridian) {
    let [hours, minutes] = time.split(":").map(Number);
    hours = parseInt(hours)
    minutes = parseInt(minutes)
    if (meridian === "PM" && hours !== 12) {
        hours += 12;
    } else if (meridian === "AM" && hours === 12) {
        hours = 0;
    }

    return { hours, minutes };
}


let getEvents = async (request,response)=>{
    
    let user = await userModel.findById(request.user.id)


    // we have to detect conflicts 
    
    let ValidIds = []
    let now = new Date()
   try{
     // user.upcoming will have ids of meetings
     let events = await Promise.all(user.upcoming.map(async(item)=>{
        let event = await eventModel.findById(item)
        if (!event) return null;

        let eventDate = new Date(event.date); 
            let eventTime = convertTo24Hour(event.time, event.meridian); 
            eventDate.setHours(eventTime.hours, eventTime.minutes, 0, 0);
            eventDate.setMinutes(eventDate.getMinutes() + event.duration*60);

            
        // check for conflict
        let conflict = await isConflict(event,user.pending)
        if(eventDate > now)
        {
            ValidIds.push(item)
            return {...event.toObject(),isConflict : conflict}
        }
        else
        {
            // current event is exceeded time
            // so we need to make shift events of participants in pending -> past
            return null;
        }
     }))

     events = events.filter(event => event !== null);
     // we have to delete those events at indices array

     if (ValidIds.length !== user.upcoming.length) {
        user.upcoming = ValidIds;
        await user.save();
    }
     
    

    response.status(200).json({events})

   }
   catch(err)
   {
    response.status(400).send(err.message)
   }
}

let setStatus = async(request,response)=>{
    
    try{
        let id = request.params.id
        let event = await eventModel.findById(id)
      
        event.isActive = !event.isActive
        await event.save()
        response.status(200).json({event})
    }
    catch(err)
    {
        response.status(400).json({message : err.message})
    }

    
    
}

// deleting an event involves remove from db and array also participants 
// we have to check in participants pending and accepted list  accepted will go to upcoming

let remove = async (request,response)=>{
    try{
        let id = request.params.id; //meeting id
    let owner_id = request.user.id

    // we have to check participants upcoming and pending
    let meet = await eventModel.findByIdAndDelete(id)

    let owner = await userModel.findById(owner_id)


    owner.upcoming = owner.upcoming.filter((item) => item.toString() !== id);
    owner.markModified('upcoming')
    await owner.save(); 
    for (let email of meet.participants) {
        let usr = await userModel.findOne({ email: email });
       
    
        if (usr) {
            
            // we have to find id in past or pending and remove
            let newPast = []
            let newPending = []
            for(item of usr.past){
                if(item.event.toString() == id.toString()){
                    continue;
                }
                else
                {
                    newPast.push(item)
                }
            }
            for(item of usr.pending){
                if(item.event.toString() == id.toString()){
                    continue;
                }
                else
                {
                    newPending.push(item)
                }
            }

            await userModel.updateOne(
                { _id: usr._id },
                {
                  $set: {
                    past: newPast,
                    pending: newPending
                  }
                }
              );
              
           
            
        }
    }

    // we have to update booked we have to remove slot

    // user.booked = "date" : [ {},{},{}]

    // we have to get array 


    owner.booked[meet.date] = owner.booked[meet.date].filter((item)=>{
        return item.eventId != meet._id.toString()
    })

    owner.markModified('booked');
    await owner.save();

    
    response.status(200).json({message : "Deleted the event"})
    }
    catch(err)
    {
        response.status(403).json({message : err.message,msg : err.message})
    }


    
}

let updevent = async(request,response)=>{
    
    try{
    let userid = request.user.id
    let eventid = request.params.id

    let user = await userModel.findById(userid)
    let event = await eventModel.findById(eventid)

   

    let details = request.body

    // before assigning we have to check Availability of the time 
    // then we proceed to save the event
    let isAvailable = await checkAvailability(user.availability,details.time,details.meridian,details.duration,details.day,user,details.date,eventid,event.date)
    // there may be case for updating we have to also pass eventId 
   
    if(!isAvailable)
    {
        return response.status(400).json({message : err.message,status : 111})
    }

    let date = details.date

    for (let i = 0; i < user.booked[date].length; i++) {
        const slot = user.booked[date][i];
        if (!slot.eventId) {
        user.booked[date][i] = { ...slot, eventId: eventid };
        break;
       }
    }
    // based on mails i have to iterate 
    // user id and event id
    // event.participants    contains  old set of emails
    // details.participants contains new set of emails
    // we have to find newMails
    // also check avoided mails

    let newMails = [];
for (let mail of details.participants) {
    if (event.participants.includes(mail)) {
        newMails.push(mail);
    }
}

let avoidedMails = [];
for (let mail of event.participants) {
    if (!details.participants.includes(mail)) {
        avoidedMails.push(mail);
    }
}

// Handle new mails
for (let mail of newMails) {
    let user = await userModel.findOne({ email: mail });
    if (user) {
        // Avoid pushing duplicates
        const alreadyExists = user.pending.some(p => p.event === eventid);
        if (!alreadyExists) {
            user.pending.push({ event: eventid, status: "pending" });
            await user.save();
        }
    }
}

// Handle removed mails
for (let mail of avoidedMails) {
    let user = await userModel.findOne({ email: mail });
    if (user) {
        user.pending = user.pending.filter(item => item.event !== eventid);
        await user.save();
    }
}

    user.markModified('booked')
    await user.save()

    

    Object.assign(event,details)
    
    await event.save()
    response.status(200).json({message : "updated the event"})
    
    

    }
    catch(err)
    {
        response.status(400).json({message : err.message})
    }

}

 


module.exports = {firstpage,create,getEvents,setStatus,remove,updevent,convertTo24Hour}
