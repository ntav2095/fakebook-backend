const realtimeControllers = require('../mvc/controllers/realtimeControllers')
const Online = require('../mvc/models/Online')




const realtimeEvents = (socket) => {

    // add to online lists

    // 
    socket.on('start-connect', (data) => realtimeControllers.handleConnect(data, socket))
    socket.on('new-message', (data) => realtimeControllers.handleNewMessage(data, socket))
    socket.on('join-room', (data) => socket.join(data))

    socket.on('disconnect', (reason) => realtimeControllers.handleDisconnect(reason, socket))

}

module.exports = realtimeEvents