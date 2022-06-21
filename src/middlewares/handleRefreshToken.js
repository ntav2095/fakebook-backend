const User = require('../mvc/models/User')
const jwt = require('jsonwebtoken')


const handleRefreshToken = async (req, res, next) => {
    const cookies = req.cookies
    const signedCookies = req.signedCookies
    console.log("signedCookies", signedCookies)
    console.log("cookies", cookies, "kk")
    if (!cookies?.refreshToken) return res.sendStatus(401)
    const refreshToken = cookies.refreshToken
    const foundUser = await User.findOne({ where: { refreshToken: refreshToken } })
    if (!foundUser) return res.sendStatus(403) // forbidden

    // evaluate jwt
    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            if (err || foundUser.name !== decoded.name || foundUser.email !== decoded.email) return res.sendStatus(403)
            const accessToken = jwt.sign(
                {
                    name: foundUser.name,
                    email: foundUser.email
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '300000s' }
            )
            res.json({ accessToken })
        }
    )
    next()
}

module.exports = handleRefreshToken 