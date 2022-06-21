// const cors = require('cors')


var whitelist = [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3306',
    'http://localhost:3306',
    process.env.REAL_API
]
var corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}



module.exports = corsOptions