const logger = require('../utilities/logger')





const requestLogger = (req, res, next) => {
    const path = req.path
    const origin = req.headersorigin
    const method = req.method
    const logItem = method + '\t' + origin + '\t' + path
    logger(logItem, 'requestLog.txt')
    next()
}

module.exports = requestLogger