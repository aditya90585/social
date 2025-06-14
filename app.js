const express = require("express")
const http = require("http")
const Server = require("socket.io")
const jwt = require("jsonwebtoken")
const cookieparser = require("cookie-parser")
const bcrypt = require("bcrypt")
const usermodel = require("./models/user")
const postmodel = require("./models/posts")
const chatmodel = require("./models/chat")
const upload = require("./config/multerupload")
const e = require("express")
require("dotenv").config()
const app = express()
const server = http.createServer(app)
const io = new Server.Server(server)
app.use(cookieparser())
app.use(express.static("public"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set("view engine", "ejs")



app.get("/", (req, res) => {
    res.render("index")
})
app.get("/login", (req, res) => {
    res.render('login')
})
app.get("/upload", (req, res) => {
    res.render("upload")
})


io.on("connection", (socket) => {
    console.log("user connected")


    socket.on('joinRoom', (roomId) => {
        socket.join(roomId)
        console.log("user joined room", roomId)
    })

    socket.on("message", async ({ roomId, senderId, message }) => {
        console.log("new message", message,senderId)


        await chatmodel.findByIdAndUpdate(roomId, {
            $push: { chat: { onlyid: senderId, message: message } }
        });

        io.to(roomId).emit("message", { senderId, message });
    })
})
app.get("/chat/:id", isloggedin, async (req, res) => {
    let id = await req.params.id
    let currentuser = await usermodel.findOne({ email: req.user.email })
    let frienddetails = await usermodel.findOne({ _id: id })
    let newchat = await chatmodel.find()
    let arraychat = await newchat.filter((e) => {
        return ((e.id1 == currentuser._id && e.id2 == frienddetails._id) || (e.id2 == currentuser._id && e.id1 == frienddetails._id))
    })
    if (frienddetails._id.toString() == currentuser._id.toString()) {
        res.redirect("/search")
    }
    else {

        if (arraychat.length == 0) {
            let chatdata = await chatmodel.create({
                id1: currentuser._id,
                id2: frienddetails._id,
            })
        }
        let newchatdata = await chatmodel.findOne({ id1: currentuser._id, id2: frienddetails._id })

        if (newchatdata == null) {
            newchatdata = await chatmodel.findOne({ id1: frienddetails._id, id2: currentuser._id })
        }

        res.render("chat", { user: frienddetails, currentuser, chatdata: newchatdata , roomId: newchatdata._id})
    }
})
app.post("/chat/:id", isloggedin, async (req, res) => {
    let currentuser = await usermodel.findOne({ email: req.user.email })

    let frienddetails = await usermodel.findOne({ _id: req.params.id })
    let newchat = await chatmodel.findOne({ id2: currentuser._id, id1: frienddetails._id })
    if (newchat == null) {
        newchat = await chatmodel.findOne({ id2: frienddetails._id, id1: currentuser._id })

    }

    let chatdata = await {
        message: req.body.messages,
        onlyid: req.params.id
    }

    await newchat.chat.push(chatdata)
    await newchat.save()



    res.redirect(`/chat/${req.params.id}`)
})
app.get("/search", isloggedin, async (req, res) => {
    let realuser = await usermodel.findOne({ email: req.user.email })
    let user = await usermodel.find({ name: req.cookies.finduser })
    res.render("search", { user: user, realuser: realuser })
})
app.post("/search", isloggedin, async (req, res) => {

    res.cookie("finduser", req.body.name)


    res.redirect("/search")
})
app.get("/feed", isloggedin, async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email })
    let post = await postmodel.find().populate("user")
    // console.log(post)
    res.render("feed", { post: post, user: user })
})
app.post("/upload", isloggedin, upload.single("image"), async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email })
    user.profile = req.file.buffer.toString("base64")
    user.save()
    res.redirect("/profile")
})
app.get("/profile", isloggedin, async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email })
    await user.populate("posts")
    res.render("profile", { user: user })
})

app.post("/post", isloggedin, upload.single("images"), async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email })
    let post = await postmodel.create({
        user: user._id,
        content: req.body.content,
        image: req.file.buffer,
    })
    user.posts.push(post._id);
    await user.save()
    res.redirect("/profile")
})
app.get("/like/:id", isloggedin, async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email })
    let id = req.params.id
    console.log(id)
    let post = await postmodel.findOne({ _id: id })
    console.log(post.like.indexOf(user._id))

    if (post.like.indexOf(user._id) === -1) {
        await post.like.push(user._id)
    }
    else {
        await post.like.splice(user._id, 1)

    }
    await post.save()

    res.redirect("/feed")
})
app.get("/delete/:id", isloggedin, async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email })
    let id = req.params.id
    console.log(id)
    let post = await postmodel.findOneAndDelete({ _id: id })
    await user.posts.splice(id, 1)
    user.save()

    res.redirect("/profile")
})
app.get("/edit/:id", isloggedin, async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email })
    let id = req.params.id
    let post = await postmodel.findOne({ _id: id })
    res.render("edit", { post: post })
})
app.post("/update/:id", isloggedin, async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email })
    let id = req.params.id
    let post = await postmodel.findOneAndUpdate({ _id: id }, { content: req.body.text })

    res.redirect("/profile")
})
app.post("/register", async (req, res) => {
    let { name, username, age, email, password } = await req.body
    let user = await usermodel.findOne({ email: email })

    // if (user) {
    //     res.send("email already exits")
    // }

    bcrypt.genSalt(10, async (err, salt) => {
        console.log("registered1")
        bcrypt.hash(password, salt, async (err, hash) => {
            console.log("registered2")
            let userdata = await usermodel.create({
                name: name,
                username: username,
                age: age,
                email: email,
                password: hash
            })
            console.log("registered")
            let userdatas = usermodel.findOne({ email: email })
            let token = jwt.sign({ email: email, userid: userdatas._id }, "123456")
            console.log("registered5")
            res.cookie("token", token)
            res.redirect("/profile")
        })
    })

})


app.post("/login", async (req, res) => {
    let { email, password } = req.body
    let user = await usermodel.findOne({ email: email })
    if (!user) {
        res.send("user not found")
    }
    bcrypt.compare(password, user.password, (err, result) => {

        if (result == true) {
            let token = jwt.sign({ email: email, userid: user._id }, "123456")
            res.cookie("token", token)
            res.redirect("/profile")
        }
        else {
            res.send("wrong password")
        }
    })
})
app.get("/logout", (req, res) => {
    res.cookie("token", "")
    res.redirect("/login")
})

function isloggedin(req, res, next) {
    if (req.cookies.token === "") {
        res.send("you are not logged in")
    }
    else {
        let user = jwt.verify(req.cookies.token, "123456", (err, decoder) => {
            req.user = decoder
        })
    }
    next();
}

server.listen(process.env.PORT, () => console.log("server running"))
