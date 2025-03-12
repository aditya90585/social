const mongoose = require("mongoose")
mongoose.connect("mongodb://127.0.0.1:27017/miniproject2")

let userschema = mongoose.Schema({
    name:String,
    username:String,
    age:Number,
    email:String,
    password:String,
    profile:{
      type:String,
      default:"default.jpg"
    },
    posts:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"posts"
        }
    ]
})

module.exports = mongoose.model("user",userschema)
