const Chat = require('./Chat.js')
const User = require('./User.js')
const Post = require('./Post.js')
const { sequelize } = require('./config')


const sync = async () => {
    try {
        await sequelize.sync({ force: true });
        console.log("Sync Models successfully")

    } catch (error) {
        console.log("Sync Models failed")
        console.log(error)

    }
}

sync({ alter: true })

module.exports = sync