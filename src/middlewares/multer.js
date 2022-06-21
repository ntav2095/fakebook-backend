
const multer = require('multer')
const path = require('path')
const getExt = require('../utilities/getExtension')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', '..', 'public', 'images'))
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + getExt(file.originalname))
    }
})

const upload = multer({ storage: storage })

module.exports = upload