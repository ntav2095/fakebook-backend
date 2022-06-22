const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('./config.js')

class User extends Model { }

User.init({
    email: DataTypes.TEXT,
    password: DataTypes.TEXT,
    name: DataTypes.TEXT,
    avatar: {
        type: DataTypes.TEXT,
        defaultValue: 'https://res.cloudinary.com/dqz4j2zua/image/upload/v1655901067/hbltcwn8jflad4upsxxz.png'
    },
    coverPhoto: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    refreshToken: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },
    friends: {
        type: DataTypes.TEXT,
        defaultValue: "[]"
    },
    notifications: {
        type: DataTypes.TEXT,
        defaultValue: "[]"
    },
    friendRequest: {
        type: DataTypes.TEXT,
        defaultValue: "[]"
    },
    chats: {
        type: DataTypes.TEXT,
        defaultValue: "[]"
    },
}, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'User' // We need to choose the model name
});


module.exports = User