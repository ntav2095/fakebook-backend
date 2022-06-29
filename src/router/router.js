const express = require('express')
const controllers = require('../mvc/controllers/controllers')
const verifyJWT = require('../middlewares/verifyJWT')
const router = express.Router()
const handleRefreshToken = require('../middlewares/handleRefreshToken')
const cloud = require('../configs/cloudinary.config');

router.post('/api/register', controllers.register)
router.post('/api/login', controllers.login)
router.post('/api/logout', controllers.logout)

// USER
router.get('/api/user/get-user/:email', verifyJWT, controllers.getUser)
router.post('/api/user/friend-request', verifyJWT, controllers.handleFriendRequest)
router.post('/api/user/change-cover-photo', verifyJWT, cloud.uploadCloud.single('photo'), controllers.handleChangeCoverPhoto)
router.post('/api/user/change-avatar', verifyJWT, cloud.uploadCloud.single('photo'), controllers.handleChangeAvatar)
router.post('/api/user/remove-cover-photo', verifyJWT, controllers.handleRemoveCoverPhoto)
router.post('/api/user/remove-avatar', verifyJWT, controllers.handleRemoveAvatar)

// NOTIFICATIONS
router.post('/api/notifications/update-seen', verifyJWT, controllers.updateSeenNotification)
router.post('/api/notifications/delete-all', verifyJWT, controllers.deleteAllNotification)

// POST
router.get('/api/post/get-all/:offset', verifyJWT, controllers.getAllPost)
router.get('/api/post/user/:email/:offset', verifyJWT, controllers.getUserPost)
router.get('/api/post/get-one/:id', verifyJWT, controllers.getAPost)
router.post('/api/post/add', verifyJWT, cloud.uploadCloud.single('photo'), controllers.addPost)
router.post('/api/post/comment', verifyJWT, controllers.handleComment)
router.post('/api/post/like', verifyJWT, controllers.handleLikePost)
router.post('/api/post/delete', verifyJWT, controllers.handleDeletePost)

// SEARCH
router.get('/api/search/:query', verifyJWT, controllers.handleSearch)

// CHAT
router.post('/api/chat/send-message', verifyJWT, controllers.handleAddChat)
router.post('/api/chat/get-chat', verifyJWT, controllers.handleGetChat)



module.exports = router