const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('./config')

class Post extends Model { }

Post.init({
    userID: {
        type: DataTypes.TEXT

    },
    email: {
        type: DataTypes.TEXT

    },
    name: {
        type: DataTypes.TEXT

    },
    avatar: {
        type: DataTypes.TEXT,
        defaultValue: 'http://localhost:9999/images/no-avatar.png'
    },
    comments: {
        type: DataTypes.TEXT,
        defaultValue: '[]'

    },
    likes: {
        type: DataTypes.TEXT,
        defaultValue: '[]'

    },
    shares: {
        type: DataTypes.TEXT,
        defaultValue: '[]'

    },
    time: {
        type: DataTypes.TEXT,
        defaultValue: '0'

    },
    text: {
        type: DataTypes.TEXT,
        defaultValue: ""

    },
    photo: {
        type: DataTypes.TEXT,
        defaultValue: ""

    }

}, {
    sequelize,
    modelName: 'Post'
});

module.exports = Post
