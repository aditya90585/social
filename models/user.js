const mongoose = require("mongoose")
mongoose.set("strictQuery",true)
mongoose.connect("mongodb://127.0.0.1:27017/miniproject")

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
