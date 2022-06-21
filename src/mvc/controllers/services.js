const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { truncate } = require('../models/User')
const User = require('../models/User')
const Post = require('../models/Post')

require('dotenv').config()
const hashPwd = (password) => {
    return new Promise((res, rej) => {
        try {
            const saltRounds = 10;
            bcrypt.hash(password, saltRounds, function (err, hash) {
                if (err) {
                    rej(err)
                } else {
                    res(hash)
                }
            });
        } catch (error) {
            rej(error)
        }
    })
}

const isMissing = (...params) => {
    for (let param of params) {
        if (!param) {
            return true
        }
    }
    return false
}

const createJWT = ({ name, email }) => {
    return {
        accessToken: jwt.sign({ name, email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 90000 }),
        refreshToken: jwt.sign({ name, email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '168h' })
    }
}

const checkPwd = (pwd, hash) => {
    return new Promise(async (res, rej) => {
        try {
            const result = await bcrypt.compare(pwd, hash);
            if (result) {
                res(true)
            }
            rej(new Error('Wrong password'))
        } catch (error) {
            rej(error)
        }
    })
}

const existedEmail = async (email) => {
    const user = await User.findOne({ where: { email: email }, logging: false })
    if (user) return true
    return false
}


const getContacts = async (email) => {
    return new Promise(async (res, rej) => {
        try {
            const foundUser = await User.findOne({ where: { email: email }, loggin: false })


            const friends = JSON.parse(foundUser.friends)
            const contacts = []
            if (friends.length) {
                for (let friendID of friends) {
                    const foundFriend = await User.findOne({ where: { id: friendID }, logging: false })
                    contacts.push(foundFriend)
                }
                const x = contacts.map(item => ({
                    avatar: item.avatar,
                    name: item.name,
                    id: item.id
                }))
                res(x)
            }

            res([])
        } catch (error) {
            console.log(error)
            rej(error)
        }
    })


}


const getAllPost = async (authEmail, offset) => {
    return new Promise(async (res, rej) => {
        try {
            const foundUser = await User.findOne({ where: { email: authEmail } })
            const friends = JSON.parse(foundUser.friends) // friends là email cho dễ

            const emailList = [...friends, foundUser.email]
            let allPost = []
            for (let email of emailList) {
                const posts = await Post.findAll({ where: { email: email } })
                allPost = [...allPost, ...posts]
            }

            let x = []

            for (let item of allPost) {
                const user = await User.findOne({ where: { email: item.email } })
                const post = {
                    id: item.id,
                    name: user.name,
                    text: item.text,
                    time: item.time,
                    avatar: user.avatar,
                    likes: item.likes ? JSON.parse(item.likes) : [],
                    comments: item.comments ? JSON.parse(item.comments) : [],
                    photo: item.photo,
                    email: item.email,
                    showComment: false
                }
                x.push(post)
            }


            x.sort((a, b) => parseInt(b.time) - parseInt(a.time)) // time giảm dần
            if (x.length === 0) res([])

            let start = (offset - 1) * 5

            if (start > x.length - 1) res([])

            let end = x.length - 1 >= start + 4 ? start + 4 : x.length - 1

            const t = x.slice(start, end + 1)
            t.reverse()
            res(t)
        } catch (error) {
            console.log("From getAllPost services: ", error)
            rej(error)
        }
    })
}

const getUserPost = async (reqEmail, offset) => {
    return new Promise(async (res, rej) => {

        try {
            const foundUser = await User.findOne({ where: { email: reqEmail } })

            if (!foundUser) res({ notFound: true })

            const posts = await Post.findAll({ where: { email: reqEmail } })

            let x = posts.map(item => ({
                id: item.id,
                name: item.name,
                text: item.text,
                time: item.time,
                avatar: foundUser.avatar,
                likes: item.likes ? JSON.parse(item.likes) : [],
                comments: item.comments ? JSON.parse(item.comments) : [],
                photo: item.photo,
                email: item.email
            }))

            x.sort((a, b) => +b.time - +a.time)
            if (x.length === 0) res([])

            let start = (offset - 1) * 5

            if (start > x.length - 1) res([])

            let end = x.length - 1 >= start + 4 ? start + 4 : x.length - 1

            const t = x.slice(start, end + 1)
            t.reverse()

            res(t)
        } catch (error) {
            console.log("From getAllPost services: ", error)
            rej(error)
        }
    })
}

const getPost = (id) => {
    return new Promise(async (res, rej) => {
        try {

            const post = await Post.findOne({ where: { id: id } })
            if (!post) return res(null)
            const email = post.email
            const user = await User.findOne({ where: { email: email } })

            const x = {
                id: post.id,
                name: user.name,
                text: post.text,
                time: post.time,
                avatar: user.avatar,
                likes: post.likes ? JSON.parse(post.likes) : [],
                comments: post.comments ? JSON.parse(post.comments) : [],
                photo: post.photo,
                email: post.email
            }

            return res(x)
        } catch (error) {
            console.log(error)
            return rej(error)

        }

    })
}


const handleSearch = (query) => {
    return new Promise(async (res, rej) => {
        try {
            // search users
            const users = await User.findAll()
            let userResult = users.filter(user => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query))
            userResult = userResult.map(item => ({
                email: item.email,
                name: item.name,
                avatar: item.avatar,
                type: "user"
            }))

            const posts = await Post.findAll()
            let postResult = posts.filter(post => post.text.toLowerCase().includes(query))
            postResult = postResult.map(item => ({
                id: item.id,
                text: item.text,
                name: item.name,
                email: item.email,
                type: "post"
            }))


            return res([...postResult, ...userResult])

        } catch (error) {
            console.log(error)
            return rej(error)
        }
    })
}

// FRIENDS

const getFriendRequest = (friendRequest) => {
    return new Promise(async (res, rej) => {
        try {
            let frRequest = []
            for (let email of friendRequest) {
                const user = await User.findOne({ where: { email: email } })
                if (user) {
                    frRequest.push({ email: email, name: user.name, avatar: user.avatar })
                }
            }

            return res(frRequest)
        } catch (error) {
            rej(error)
        }
    })
}

const getFriends = (frArray) => {
    return new Promise(async (res, rej) => {
        try {
            let friends = []
            for (let email of frArray) {
                const user = await User.findOne({ where: { email: email } })
                friends.push({
                    email: user.email, name: user.name, avatar: user.avatar
                })
            }

            res(friends)
        } catch (error) {
            console.log("From getFriends services: ", error)
            rej(error)
        }
    })
}

module.exports = {
    hashPwd,
    isMissing,
    createJWT,
    checkPwd,
    existedEmail,

    getContacts,
    getUserPost,
    getPost,
    getAllPost,

    handleSearch,

    getFriendRequest,
    getFriends
}