const Online = require('../mvc/models/Online')
const User = require('../mvc/models/User')



const joinFriendRoom = async (data, socket) => {
    try {
        const user = await User.findOne({ where: { id: data.userID } })
        const friends = !user.friends ? [] : JSON.parse(user.friends)

        let onlines = await Online.findAll()
        // lay ra socket cua friend dang onl

        // lấy mảng chứa friends online + sockets 
        const onlFriends = onlines.filter(online => friends.includes(online.userID))

        if (onlFriends.length) {
            for (let onlFriend of onlFriends) {
                socket.join(onlFriend.socketID)
            }
        }

    } catch (error) {
        console.log(error)
    }
}

const updateOnline = async (data, socket, type) => {
    if (type === 'online') {
        await Online.create({
            userID: data.userID,
            socketID: socket.id
        })
        console.log(socket.id, 'online')


    } else {
        console.log(socket.id, 'offline')
        const online = await Online.findOne({ where: { socketID: socket.id } })
        // const online = await Online.findOne({ where: { socketID: socket.id } })
        if (online) {
            console.log(socket.id, 'ton tai')

            await online.destroy()
        } else {
            console.log(socket.id, 'Khong ton tai')
        }
    }
}



const joinChatRoom = async (data, socket) => {
    try {
        const userID = data.userID
        const user = await User.findOne({ where: { id: userID } })
        if (!user) {
            throw new Error("From joinChatRoom: missing userID from client")
        }

        let conversationList = user.conversations
        if (!conversationList) {
            conversationList = []
        }
        conversationList = JSON.parse(conversationList)
        if (conversationList.length) {
            for (let conversationID of conversationList) {
                socket.join(conversationID)
            }
        }
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    updateOnline,
    joinFriendRoom,
    joinChatRoom
}