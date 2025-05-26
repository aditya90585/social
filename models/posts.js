const mongoose = require("mongoose")


let postschema = mongoose.Schema({
   user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
   },
   date:{
    type:Date,
    default:Date.now
   },
   image:Buffer,
   content:String,
   like:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }
   ]
})

module.exports = mongoose.model("posts",postschema)
