const mongoose = require("mongoose")


let chatschema = mongoose.Schema({
  id1:String,
  id2:String,
  chat:[
    {
        message:String,
        onlyid:String
    }
  ]
})

module.exports = mongoose.model("chat",chatschema)