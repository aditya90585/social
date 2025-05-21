const mongoose = require("mongoose")
mongoose.connect("mongodb+srv://adityarajput81971:1Rajput11@cluster0.vrzk0uy.mongodb.net/socialwebsite")

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
