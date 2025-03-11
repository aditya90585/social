const express = require("express")
const bcrpt = require("bcrypt")
const jwt = require("jsonwebtoken")
const cookieparser = require("cookie-parser")
const bcrypt = require("bcrypt")
const usermodel = require("./models/user")
const postmodel = require("./models/posts")
const upload = require("./config/multerupload")
require("dotenv").config()
const app = express()
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
app.get("/feed", isloggedin,async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email })
    let post = await postmodel.find().populate("user")
    console.log(post)
    res.render("feed", { post: post ,user:user})
})
app.post("/upload", isloggedin, upload.single("image"), async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email })
    user.profile = req.file.filename
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
        imageurl: req.file.filename,
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
    let { name, username, age, email, password } = req.body
    let user = await usermodel.findOne({ email: email })

    if (user) {
        res.send("email already exits")
    }
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let userdata = await usermodel.create({
                name: name,
                username: username,
                age: age,
                email: email,
                password: hash
            })
        })
    })

    let token = jwt.sign({ email: email, userid: user._id }, "123456")
    res.cookie("token", token)
    res.send("registered")
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

app.listen(process.env.PORT)
