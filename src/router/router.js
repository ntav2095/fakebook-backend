const express = require('express')
const upload = require('../middlewares/multer')
const controllers = require('../mvc/controllers/controllers')
const verifyJWT = require('../middlewares/verifyJWT')
const router = express.Router()
const handleRefreshToken = require('../middlewares/handleRefreshToken')

router.post('/api/register', controllers.register)
router.post('/api/login', controllers.login)
router.post('/api/logout', controllers.logout)

// router.get('/api/posts/:type/:email/:offset', verifyJWT, controllers.getPosts) //

// USER
router.get('/api/user/get-user/:email', verifyJWT, controllers.getUser) //
router.post('/api/user/friend-request', verifyJWT, upload.single('photo'), controllers.handleFriendRequest) //
router.post('/api/user/change-cover-photo', verifyJWT, upload.single('photo'), controllers.handleChangeCoverPhoto) //
router.post('/api/user/change-avatar', verifyJWT, upload.single('photo'), controllers.handleChangeAvatar) //
router.post('/api/user/remove-cover-photo', verifyJWT, controllers.handleRemoveCoverPhoto) //
router.post('/api/user/remove-avatar', verifyJWT, controllers.handleRemoveAvatar) //

// NOTIFICATIONS
router.post('/api/notifications/update-seen', verifyJWT, controllers.updateSeenNotification) //
router.post('/api/notifications/delete-all', verifyJWT, controllers.deleteAllNotification) //

// POST
router.get('/api/post/get-all/:offset', verifyJWT, controllers.getAllPost) // dùng cho trang home: post của bản thân và bạn bè
router.get('/api/post/user/:email/:offset', verifyJWT, controllers.getUserPost) // lấy 1 người, bản thân hoặc bạn bè hoặc người lạ
router.get('/api/post/get-one/:id', verifyJWT, controllers.getAPost) // lấy 1 post cụ thể, vì sao không dùng route cho nhanh? lỡ chia sẽ qua link thì sao.
router.post('/api/post/add', verifyJWT, upload.single('photo'), controllers.addPost) // thêm 1 post
router.post('/api/post/comment', verifyJWT, controllers.handleComment) // post vì cần biết ai cmt, like
router.post('/api/post/like', verifyJWT, controllers.handleLikePost) // post vì cần biết ai cmt, like; nếu get thì tự nhiên gõ link vào là like thì vô lý
router.post('/api/post/delete/:id', verifyJWT, controllers.handleDeletePost) // post vì cần biết ai cmt, like; nếu get thì tự nhiên gõ link vào là like thì vô lý

// SEARCH
router.get('/api/search/:query', verifyJWT, controllers.handleSearch) // post vì cần biết ai cmt, like; nếu get thì tự nhiên gõ link vào là like thì vô lý

// CHAT
router.post('/api/chat/send-message', verifyJWT, controllers.handleAddChat)
router.post('/api/chat/get-chat', verifyJWT, controllers.handleGetChat)

module.exports = router