const { v4: uuidv4 } = require('uuid')
const logger = require('../../utilities/logger')
const Conversation = require('../models/Conversation')
const Online = require('../models/Online')
const User = require('../models/User')
const realtimeServices = require('../../realtimeServices/realtimeServices')


const handleNewMessage = async (data, socket) => {
    try {
        const senderID = data.senderID
        const receiverID = data.receiverID
        const conversationID = data.conversationID

        if (!senderID || !receiverID) {
            throw new Error("From handleNewMessage: missing senderID/receiverID")
        }
        if (!receiverID.length) {
            throw new Error("From handleNewMessage: missing receiverID")
        }

        const participants = [...receiverID, senderID]

        // nếu không có conversationID thì tạo mới 1 cái trên db
        // nếu có rồi thì không cần tạo, chỉ update content trên conversation có sẵn
        if (!conversationID) {
            const newConversation = await Conversation.create({
                userID: JSON.stringify(participants),
                content: JSON.stringify([data.content]),
                lastTime: data.time
            })

            // update conversations column of all user
            for (let participantID of participants) {
                const user = await User.findOne({ where: { id: participantID } })
                user.conversations = JSON.stringify([...JSON.parse(user.conversations), newConversation.id])
                user.save()
            }


            // xem có ai có trong danh sách chat đang onl không
            // lấy tất cả các socket của người đang onl
            const onlines = await Online.findAll()

            const onlSockets = onlines.filter(online => participants.includes(+online.userID))
            for (let item of onlSockets) {
                global.io.to(item.socketID).emit('new-room', {
                    conversationID: newConversation.id
                })
            }

        } else {
            const curConversation = await Conversation.findOne({ where: { id: conversationID } })
            curConversation.content = JSON.stringify([...JSON.parse(curConversation.content), data.content])
            curConversation.save()

            global.io.sockets.in(conversationID).emit('new-message', {
                senderID: senderID,
                content: data.content,
                lastTime: data.lastTime,
                conversationID: conversationID
            })
        }


    } catch (error) {
        console.log(error)
    }
}


const handleConnect = async (data, socket) => {

    try {
        // update online table DB
        realtimeServices.updateOnline(data, socket, 'online')
        realtimeServices.joinFriendRoom(data, socket)
        realtimeServices.joinChatRoom(data, socket)

        // thông báo cho bạn bè: tao online rồi nè!
        io.sockets.in(socket.id).emit('friends-online', { userID: data.userID, time: Date.now() })
    } catch (error) {
        console.log(error)
    }

}

const handleDisconnect = async (reason, socket) => {
    await realtimeServices.updateOnline(null, socket, 'offline')
}

module.exports = {
    handleConnect,
    handleDisconnect,
    handleNewMessage
}