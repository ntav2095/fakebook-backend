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
        defaultValue: 'https://res.cloudinary.com/dqz4j2zua/image/upload/v1655901067/hbltcwn8jflad4upsxxz.png'
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
