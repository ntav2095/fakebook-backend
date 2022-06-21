// importing server libraries
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')

// importing middlewares
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const credentials = require('./middlewares/credentials')
const router = require('./router/router')
const corsOptions = require('./middlewares/cors')
const requestLogger = require('./middlewares/requestLogger')
// const realtimeEvents = require('./realtimeEvents/realtimeEvents')

// importing utilities
const logger = require('./utilities/logger.js')

// importing databases
const { testConnectDB } = require('./mvc/models/config')


// server initialization
const ioOptions = {
    cors: {
        origin: "*"
    }
}

const app = express()

const httpServer = createServer(app);
const io = new Server(httpServer, ioOptions);
global.io = io


// using middlewares
app.use(credentials)

// app.use(cors({ origin: true, credentials: true }))
app.use(cors(corsOptions))
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token,Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT ,DELETE');
    res.header('Access-Control-Allow-Credentials', true);
    next();
})
app.use(cookieParser())
app.use(requestLogger)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/', express.static('public'))
app.use(router)

testConnectDB()
const x = process.env.PORT || 3000
httpServer.listen(x, () => {
    console.log('Server is running on port ', x)
})

// io server
// io.on("connection", realtimeEvents);


