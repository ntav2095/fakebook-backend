const logger = require('../../utilities/logger')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const User = require('../models/User')
const Post = require('../models/Post')
const Chat = require('../models/Chat')
const services = require('./services')
const fs = require('fs')
const cloud = require("../../configs/cloudinary.config")
const NO_AVATAR = "https://res.cloudinary.com/dqz4j2zua/image/upload/v1655901067/hbltcwn8jflad4upsxxz.png"

// LOGIN, LOGOUT, REGISTER
const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        console.log(email, password, name)
        if (services.isMissing(email, password, name)) return res.status(401).json({ ok: false, msg: "Missing parameters" })

        if (await services.existedEmail(email)) return res.status(401).json({ ok: false, msg: "Email Existed" })

        const hash = await services.hashPwd(password)
        const { accessToken, refreshToken } = services.createJWT({ name: name, email: email })
        const newUser = await User.create({
            email: email,
            password: hash,
            name: name,
            refreshToken: refreshToken,
        })

        return res.status(200)
            .cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 60 * 60 * 24 * 1000 })
            .json({
                ok: true,
                msg: "User created",
                data: {
                    accessToken: accessToken,
                    email: email,
                    name: name,
                    id: newUser.id
                }
            })

    } catch (error) {
        return res.status(500).json({
            ok: false,
            msg: error.message
        })
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (services.isMissing(email, password)) return res.status(401).json({ ok: false, msg: "Missing email or password" })

        const foundUser = await User.findOne({ where: { email: email }, logging: false });

        if (!foundUser) return res.status(401).json({ ok: false, msg: "Email doesn't exist" })
        const hash = foundUser.password
        const isMatch = await services.checkPwd(password, hash)
        if (isMatch) {
            const { accessToken, refreshToken } = services.createJWT({
                id: foundUser.id,
                email: foundUser.email
            })

            foundUser.refreshToken = refreshToken

            const frRequest = await services.getFriendRequest(JSON.parse(foundUser.friendRequest))
            const friends = await services.getFriends(JSON.parse(foundUser.friends))

            await foundUser.save()
            const notifications = JSON.parse(foundUser.notifications).map(item => ({ ...item, avatar: foundUser.avatar }))

            return res.status(200)
                .cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 900000 })
                .json({
                    ok: true,
                    msg: "Logined",
                    user: {
                        email: foundUser.email,
                        id: foundUser.id,
                        name: foundUser.name,
                        accessToken: accessToken,
                        friends: friends,
                        avatar: foundUser.avatar ? foundUser.avatar : NO_AVATAR,
                        coverPhoto: foundUser.coverPhoto,
                        notifications: notifications,
                        friendRequest: frRequest,
                    }
                })
        }

        return res.status(401).json({ ok: false, msg: "Wrong password" })

    } catch (error) {
        return res.status(500).json({ ok: false, msg: error.message })
    }
}

const logout = async (req, res) => {
    try {
        const cookies = req.cookies
        const signedCookies = req.signedCookies
        console.log(cookies, signedCookies)
        res.clearCookie("refreshToken", { httpOnly: true })
        return res.status(200).json({ ok: true, msg: "Testing logout" })
    } catch (error) {
        return res.status(500).json({ ok: false, msg: error.message })
    }
}

// USER
const getUserPost = async (req, res) => {
    try {
        const reqEmail = req.params.email
        const offset = req.params.offset
        if (!reqEmail) return res.status(400).json({ ok: false, msg: "From getUserPost controller: Missing request email" })
        const posts = await services.getUserPost(reqEmail, offset)
        if (posts.notFound) return res.status(404).json({ ok: false, notFound: true, msg: "user not found" })
        return res.status(200).json({ ok: true, data: posts })
    } catch (error) {
        console.log("error from getUserPost controller")
        console.log(error)
        return res.status(500).json({ ok: false, msg: "error from getUserPost controller" + error.message })
    }
}

const getUser = async (req, res) => {
    try {
        const authEmail = req.email
        const { email } = req.params
        const user = await User.findOne({ where: { email: email } })
        const auther = await User.findOne({ where: { email: authEmail } })
        if (!user) return res.status(404).json({ ok: false, notFound: true, msg: "From getUser controller: user not found" })

        const friends = await services.getFriends(JSON.parse(user.friends))
        const friendRequest = await services.getFriendRequest(JSON.parse(user.friendRequest))
        const cookies = req.cookies ? req.cookies : "khong co cookies"

        // determine relationship 
        // note: 
        // 0: yourself
        // 1: friend
        // 2:  ban dang gui loi moi ket ban cho ho
        // 3: dang de nghi ket ban voi ban 
        // 4: khong la j ca
        let relationsship = ''
        if (email === authEmail) {
            relationsship = 0
        } else if (JSON.parse(user.friends).includes(authEmail)) {
            relationsship = 1
        } else if (JSON.parse(user.friendRequest).includes(authEmail)) {
            relationsship = 2
        } else if (JSON.parse(auther.friendRequest).includes(email)) {
            relationsship = 3
        } else {
            relationsship = 4
        }

        return res.status(200).json({
            ok: true,
            data: {
                id: user.id,
                email: user.email,
                friends: friends,
                name: user.name,
                avatar: user.avatar,
                profilePhoto: user.profilePhoto,
                friendRequest: friendRequest,
                avatar: user.avatar,
                coverPhoto: user.coverPhoto,
                cookies: JSON.stringify(cookies),
                relationship: relationsship
            }
        })


    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, msg: error.message })
    }
}

//NOTIFICATIONS
const updateSeenNotification = async (req, res) => {
    try {
        const email = req.email
        const user = await User.findOne({ where: { email: email } })
        const newNotifications = JSON.parse(user.notifications).map(item => ({ ...item, seen: true }))

        user.notifications = JSON.stringify(newNotifications)
        await user.save()
        return res.status(200).json({ ok: true, msg: "updated notifications" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, msg: error.message })
    }
}

const deleteAllNotification = async (req, res) => {
    try {
        const email = req.email
        const user = await User.findOne({ where: { email: email } })
        user.notifications = JSON.stringify([])
        await user.save()
        return res.status(200).json({ ok: true, msg: "removed all notifications" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, msg: error.message })
    }

}

// FRIENDS
const handleFriendRequest = async (req, res) => {
    try {
        const { recEmail, type } = req.body
        if (!recEmail || !type) return res.status(400).json({ ok: false, msg: "missing receiver email or type" })
        const authEmail = req.email

        // type: huygui, gui, dongy, tuchoi
        let receiver = await User.findOne({ where: { email: recEmail } })
        let auther = await User.findOne({ where: { email: authEmail } })
        let recRequest = JSON.parse(receiver.friendRequest)
        let authRequest = JSON.parse(auther.friendRequest)

        if (type === "gui") {
            // auther gui loi moi ket ban cho receiver
            recRequest = [...recRequest, authEmail]
        }

        if (type === 'dongy') {
            // receiver gui cho auther, duoc auther dong y
            // xoa email cua receiver trong friendRequest cua auhter va them vao danh sach friends cua nhau
            authRequest = authRequest.filter(item => item !== recEmail)
            receiver.friends = JSON.stringify([...JSON.parse(receiver.friends), authEmail])
            auther.friends = JSON.stringify([...JSON.parse(auther.friends), recEmail])
        }

        if (type === "huygui") {
            // auther gui request cho receiver nhung gio rut lai khong gui nua
            // xoa email cua auther trong receiver
            recRequest = recRequest.filter(item => item != authEmail)
        }

        if (type === 'tuchoi') {
            // receiver gui request cho auther, nhung auther tu choi
            // xoa email cua rec trogn friendRequest cua auther
            authRequest = authRequest.filter(item => item !== recEmail)
        }

        if (type === 'huyketban') {
            auther.friends = JSON.stringify(JSON.parse(auther.friends).filter(item => item !== receiver.email))
            receiver.friends = JSON.stringify(JSON.parse(receiver.friends).filter(item => item !== auther.email))
        }

        auther.friendRequest = JSON.stringify(authRequest)
        receiver.friendRequest = JSON.stringify(recRequest)
        await auther.save()
        await receiver.save()


        const authFriendRequest = await services.getFriendRequest(JSON.parse(auther.friendRequest))
        const authFriends = await services.getFriends(JSON.parse(auther.friends))

        const recFriendRequest = await services.getFriendRequest(JSON.parse(receiver.friendRequest))
        const recFriends = await services.getFriends(JSON.parse(receiver.friends))

        let relationship = 0
        switch (type) {
            case 'gui':
                relationship = 2
                break;
            case 'dongy':
                relationship = 1
                break;
            case 'huygui':
                relationship = 4
                break;
            case 'tuchoi':
                relationship = 4
                break;
            case 'huyketban':
                relationship = 4
                break;
            default: 0
        }

        return res.status(200).json({
            ok: true,
            data: {
                relationship: relationship,
                authFriends: authFriends,
                recFriends: recFriends
            }
        })



    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, msg: error.message })
    }
}

// SEARCH
const handleSearch = async (req, res) => {
    try {
        let { query } = req.params
        query = query.toLowerCase()
        const result = await services.handleSearch(query)
        return res.status(200).json({ ok: true, data: result })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, msg: error.msg })
    }
}

// POST
const addPost = async (req, res) => {
    try {
        const { userID, name, avatar, time, text, likes, comments, shares } = JSON.parse(req.body.postItem)

        if (services.isMissing(userID, name, avatar, time)) return res.status(400).json({ ok: false, msg: "Missing post's userID/name/avatar" })

        let photo = ''
        const file = req.file
        if (file) {
            photo = file.path
        }

        const x = JSON.stringify([])
        const result = await Post.create({
            userID, text, photo, time, avatar, name,
            likes: x, comments: x, shares: x, email: req.email
        })

        const post = {
            id: result.id,
            name: result.name,
            text: result.text,
            time: result.time,
            avatar: result.avatar,
            likes: result.likes ? JSON.parse(result.likes) : [],
            comments: result.comments ? JSON.parse(result.comments) : [],
            photo: result.photo,
            email: result.email,
            showComment: false
        }

        return res.status(200).json({ ok: true, msg: "Post's added", data: post })
    } catch (error) {
        return res.status(500).json({ ok: false, msg: error.message })
    }

}

const getAPost = async (req, res) => {
    try {
        const postID = req.params.id
        const post = await services.getPost(postID)

        if (!post) return res.status(404).json({ ok: false, msg: "Not found" })

        return res.status(200).json({ ok: true, data: post })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, msg: error.message })
    }
}

const handleDeletePost = async (req, res) => {
    try {
        const email = req.email;
        const { id } = req.body

        const post = await Post.findOne({ where: { id: id, email: email } })
        if (!post) return res.status(400).json({ ok: false, msg: "Post does not exist" })
        const photo = post.photo;
        // if (photo) {
        //     const photoDir = path.join(__dirname, '..', '..', '..', 'public', photo.slice(photo.indexOf("images")))
        //     console.log(photoDir)
        //     fs.unlink(photoDir, function (err) {
        //         if (err && err.code == 'ENOENT') {
        //             // file doens't exist
        //             console.info("File doesn't exist, won't remove it.");
        //         } else if (err) {
        //             // other errors, e.g. maybe we don't have enough permission
        //             console.error("Error occurred while trying to remove file");
        //         } else {
        //             console.info(`removed`);
        //         }
        //     });
        // }
        let deleteResult = ''

        const getFileName = (path) => {
            let fileName = path;
            while (fileName.indexOf("/") >= 0) {
                fileName = fileName.slice(fileName.indexOf("/") + 1)
            }
            return fileName.slice(0, fileName.indexOf("."))
        }

        if (photo) {
            cloud.cloudinary.uploader.destroy(getFileName(photo), function (error, result) {
                if (error) {
                    console.log(error)
                    deleteResult = error.message
                } else {
                    deleteResult = result
                }

            }
            )
        }

        await post.destroy()
        return res.status(200).json({ ok: true, msg: "deleted", deletePhotoRes: deleteResult })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, msg: error.message })
    }

}

const getAllPost = async (req, res) => {
    try {
        const { offset } = req.params
        const authEmail = req.email
        if (!offset) return res.status(400).json({ ok: false, msg: "From getALlPost: Missing offset" })

        const posts = await services.getAllPost(authEmail, offset)

        return res.status(200).json({
            ok: true,
            msg: 'fetched all posts',
            data: posts,
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, msg: "From catch geAllPost: " + error.message })
    }
}

const handleLikePost = async (req, res) => {
    try {
        const authEmail = req.email
        const { postID, time, type } = req.body
        if (!postID || !time || !type) return res.status(400).json({ ok: false, msg: "handleLikePost controller: Missing params " })

        const giver = await User.findOne({ where: { email: authEmail } })
        const post = await Post.findOne({ where: { id: postID } })

        let likes = JSON.parse(post.likes)
        if (!likes.length) {
            likes = [{ userID: giver.id, name: giver.name, email: giver.email }]
        } else {
            likes = type === 'like' ? [...likes, { userID: giver.id, name: giver.name, email: giver.email }] : likes.filter(item => item.userID !== giver.id)
        }

        post.likes = JSON.stringify(likes)
        await post.save()

        // create notification for receiver
        const receiver = await User.findOne({ where: { email: post.email } })
        if (receiver.email != giver.email) {
            const notifications = JSON.parse(receiver.notifications)
            notifications.push({ name: giver.name, avatar: giver.avatar, type: type, time: time, seen: false, postID: postID, id: uuidv4() })

            receiver.notifications = JSON.stringify(notifications)
            await receiver.save()
        }

        return res.status(200).json({ ok: true, msg: "liked", data: JSON.parse(post.likes) })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, msg: "Error from catch handleLikePost controller: " + error.message })
    }
}

const handleComment = async (req, res) => {

    try {
        const { postID, userID, text, time, avatar } = req.body

        if (services.isMissing(postID, userID, text, time, avatar)) return res.status(400).json({ ok: false, msg: "Missing comment's postID/userID/text/time/avatar" })
        const foundPost = await Post.findOne({ where: { id: postID }, logging: false })

        let foundComments = JSON.parse(foundPost.comments)
        foundPost.comments = JSON.stringify([...foundComments, { postID, userID, text, time, avatar }])

        await foundPost.save()

        // handle notifications
        const receiver = await User.findOne({ where: { email: foundPost.email } })
        const commenter = await User.findOne({ where: { email: req.email } })
        if (receiver.email != commenter.email) {
            const notiItem = { name: commenter.name, avatar: commenter.avatar, type: "comment", time: time, seen: false, postID: postID, id: uuidv4() }
            let notifications = JSON.parse(receiver.notifications)
            notifications.push(notiItem)
            receiver.notifications = JSON.stringify(notifications)

            await receiver.save()
        }


        return res.status(200).json({ ok: true, msg: "commented" })
    } catch (error) {
        console.log(error)
        res.status(200).json({ ok: false, msg: error.message })
    }
}

// AVATAR AND COVER PHOTO
const handleChangeCoverPhoto = async (req, res) => {
    try {
        const email = req.email
        const { time } = req.body
        const file = req.file

        if (!file) return res.status(400).json({ ok: false, msg: "Missing file" })
        if (!time) return res.status(400).json({ ok: false, msg: "Missing time" })

        const coverPhoto = file.path
        const user = await User.findOne({ where: { email: email } })
        user.coverPhoto = coverPhoto
        const postItem = {
            userID: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            text: `${user.name} change cover photo`,
            photo: coverPhoto,
            likes: [],
            shares: [],
            comments: [],
            time: time
        }

        const result = await Post.create({ ...postItem, likes: JSON.stringify([]), shares: JSON.stringify([]), comments: JSON.stringify([]) })
        await user.save()
        return res.status(200).json({ ok: true, msg: "updated coverphoto", data: { ...postItem, id: result.id } })
    } catch (error) {
        return res.status(500).json({ ok: false, msg: error.message })
    }
}

const handleRemoveCoverPhoto = async (req, res) => {
    try {
        const email = req.email
        const { time } = req.body
        if (!time) return res.status(400).json({ ok: false, msg: 'missing time' })

        const user = await User.findOne({ where: { email: email } })
        user.coverPhoto = ""
        const postItem = {
            userID: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            text: `${user.name} removed cover photo`,
            photo: '',
            likes: [],
            shares: [],
            comments: [],
            time: time
        }
        const result = await Post.create({ ...postItem, likes: JSON.stringify([]), shares: JSON.stringify([]), comments: JSON.stringify([]) })

        await user.save()
        return res.status(200).json({ ok: true, msg: "removed coverphoto", data: { ...postItem, id: result.id } })
    } catch (error) {
        return res.status(500).json({ ok: false, msg: error.message })
    }

}

const handleChangeAvatar = async (req, res) => {
    try {
        const email = req.email
        const { time } = req.body
        const file = req.file

        if (!file) return res.status(400).json({ ok: false, msg: "Missing file" })
        if (!time) return res.status(400).json({ ok: false, msg: "Missing time" })

        const avatar = file.path
        const user = await User.findOne({ where: { email: email } })
        user.avatar = avatar
        const postItem = {
            userID: user.id,
            name: user.name,
            email: user.email,
            avatar: avatar,
            text: `${user.name} changed avatar`,
            photo: avatar,
            likes: [],
            shares: [],
            comments: [],
            time: time
        }

        const result = await Post.create({ ...postItem, likes: JSON.stringify([]), shares: JSON.stringify([]), comments: JSON.stringify([]) })
        await user.save()
        return res.status(200).json({ ok: true, msg: "updated avatar", data: { ...postItem, id: result.id } })
    } catch (error) {
        return res.status(500).json({ ok: false, msg: error.message })
    }
}

const handleRemoveAvatar = async (req, res) => {
    try {
        const email = req.email
        const { time } = req.body
        if (!time) return res.status(400).json({ ok: false, msg: 'missing time' })

        const user = await User.findOne({ where: { email: email } })
        user.avatar = ""
        const postItem = {
            userID: user.id,
            name: user.name,
            email: user.email,
            avatar: '',
            text: `${user.name} removed cover photo`,
            photo: '',
            likes: [],
            shares: [],
            comments: [],
            time: time
        }

        const result = await Post.create({ ...postItem, likes: JSON.stringify([]), shares: JSON.stringify([]), comments: JSON.stringify([]) })
        await user.save()
        return res.status(200).json({ ok: true, msg: "removed avatar", data: { ...postItem, id: result.id } })
    } catch (error) {
        return res.status(500).json({ ok: false, msg: error.message })
    }

}

// CHAT
const handleAddChat = async (req, res) => {
    try {
        const sender = req.email
        const { receiver, msgItem } = req.body
        if (!receiver || !msgItem) return res.status(400).json({ ok: false, msg: "From handleChat: missing receiver or content" })

        // find chat in chats table
        // tim 2 row cua sender va receiver
        let senderChat = await Chat.findOne({ where: { sender: sender, receiver: receiver } })
        let receiverChat = await Chat.findOne({ where: { sender: receiver, receiver: sender } })
        if (!senderChat) {
            senderChat = await Chat.create({ sender: sender, receiver: receiver })
        }

        if (!receiverChat) {
            receiverChat = await Chat.create({ sender: receiver, receiver: sender })
        }

        senderChat.content = JSON.stringify([...JSON.parse(senderChat.content), msgItem])
        receiverChat.content = JSON.stringify([...JSON.parse(receiverChat.content), msgItem])

        await senderChat.save()
        await receiverChat.save()

        return res.status(200).json({ ok: true, msg: "gui tin nhan thanh cong" })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, msg: "From handleChat " + error.message })
    }
}

const handleGetChat = async (req, res) => {
    try {
        const authEmail = req.email
        const recEmail = req.body.receiver
        const { receiver } = req.body
        if (!recEmail) return res.status(400).json({ ok: false, msg: "missing receiver" })
        const chat = await Chat.findOne({ where: { sender: authEmail, receiver: recEmail } })
        if (!chat) return res.status(200).json({ ok: true, chat: [] })
        return res.status(200).json({ ok: true, chat: JSON.parse(chat.content), chatID: chat.id })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, msg: "From handleGetChat controller: " + error.message })
    }

}

module.exports = {
    register, login, logout,
    //  likePost, profilePage, getContacts,
    // handleFormData, 
    getUser, handleFriendRequest,
    handleChangeCoverPhoto, handleRemoveCoverPhoto, handleChangeAvatar, handleRemoveAvatar,
    addPost, handleLikePost, handleComment, getAPost,
    getAllPost, getUserPost, handleDeletePost,
    updateSeenNotification, deleteAllNotification,
    handleSearch,
    handleGetChat, handleAddChat
}