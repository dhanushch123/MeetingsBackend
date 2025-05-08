const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      match: /.+\@.+\..+/ 
    },
    password: { type: String, required: true },
    gender: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    upcoming: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "events" }], 
      default: []
    },
    pending: {
      type: [
        {
          event: { type: mongoose.Schema.Types.ObjectId, ref: "events" }, 
          status: { type: String, enum: ["accepted", "rejected", "pending"], default: "pending" }
        }
      ],
      default: []
    },
    cancelled: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "events" }], 
      default: []
    },
    past: {
      type: [
        {
          event: { type: mongoose.Schema.Types.ObjectId, ref: "events" }, 
          status: { type: String, enum: ["accepted", "rejected", "pending"], default: "pending" }
        }
      ],
      default: []
    },
    Zone: { type: String, required: true, default: "UTC" },
    booked: {
      type: Object,
      default: {} // keys are date strings, values are arrays of {start, end}
    },
    availability: {
      type: [
          {
              day: { type: String, required: true },
              slots: [
                  {
                      start: { type: String, default: "" },
                      end: { type: String, default: "" }
                  }
              ]
          }
      ],
      default: [
          { day: "Monday", slots: [{ start: "08:00", end: "20:00" }] },
          { day: "Tuesday", slots: [{ start: "", end: "" }] },
          { day: "Wednesday", slots: [{ start: "", end: "" }] },
          { day: "Thursday", slots: [{ start: "", end: "" }] },
          { day: "Friday", slots: [{ start: "", end: "" }] },
          { day: "Saturday", slots: [{ start: "", end: "" }] },
          { day: "Sunday", slots: [{ start: "", end: "" }] }
      ]
  }

    
    
  },
  { stamps: true }
);
// dhanushch3@gmail.com,perry465@gmail.com,ruturaj465@gmail.com,sutherland465@gmail.com,brevis465@gmail.com,amelia465@gmail.com,shreyas465@gmail.com,smrithi465@gmail.com
const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
