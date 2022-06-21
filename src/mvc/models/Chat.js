const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('./config.js')

class Chat extends Model { }

Chat.init({
    content: {
        type: DataTypes.TEXT,
        defaultValue: '[]'
    },

    sender: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },

    receiver: {
        type: DataTypes.TEXT,
        defaultValue: ''
    },

}, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'Chat' // We need to choose the model name
});


module.exports = Chat