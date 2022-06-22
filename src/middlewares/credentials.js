const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000", process.env.REAL_API,
    "https://chipper-crumble-5a960b.netlify.app"]

const credentials = (req, res, next) => {
    const origin = req.headers.origin

    if (allowedOrigins.includes(origin) || !origin) {
        res.header("Access-Control-Allow-Credentials", "true")
    }
    next()
}

module.exports = credentials