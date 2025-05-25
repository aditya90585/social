const mongoose = require("mongoose")


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

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
