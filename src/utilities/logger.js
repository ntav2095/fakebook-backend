const { format: timeFormat } = require('date-fns')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')
const { existsSync } = require('fs')
// import fsPromises from fs.promises

const path = require('path')

const fsPromises = fs.promises
const logger = async (msg, fileName) => {
    try {
        const id = uuidv4()
        const time = timeFormat(Date.now(), 'HH:mm:ss dd:MM:yyyy')
        const logItem = time + '\t' + id + '\t' + msg + '\n'
        const logPath = path.join(__dirname, '..', 'logs')

        // check logs folder exist
        if (!existsSync(logPath)) {
            await fs.mkdir(logPath, (err) => {
                if (err) {
                    console.log(error)
                }
            })
        }
        // write log
        await fsPromises.appendFile(path.join(logPath, fileName), logItem, (err) => {
            if (err) {
                console.log(error)
            }
        })
    } catch (error) {
        console.log("Error from logger.js")
        console.log(error)
    }
}

module.exports = logger