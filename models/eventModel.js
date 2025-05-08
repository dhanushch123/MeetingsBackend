const mongoose = require('mongoose')

let eventSchema = new mongoose.Schema({
    meetingname:{
        type : String,
        required : true
    },
    eventtopic : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    hostname : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    date : {
        type : String,
        required : true
    },
    time : {
        type : String,
        required : true
    },
    day : {
        type : String,
        required : true
    },
    meridian : {
        type : String,
        required : true
    },
    month : {
        type : String,
        required : true
    },
    participants : {
        type : []
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "users",
        required : true
    },
    elink : {
        type : String,
        required : true
    },
    duration :
    {
        type : String,
        required : true
    },
    isActive : 
    {
        type : Boolean,
        required : true,
        default : true
    },
    zone : {
        type : String,
        required : true

    },
    color : {
        type : String,
        required : true,
        default : "#342B26"
    },
    endTime : {
        type : String,
        required : true
    }

    
},{ timestamps: true })


const eventModel = mongoose.model("events",eventSchema)

module.exports = eventModel
