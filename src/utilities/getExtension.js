const reverseString = string => string.split('').reverse().join('')

const getExt = (originalName) => {
    const reversedName = reverseString(originalName)
    const dotIndex = reversedName.indexOf('.')
    const reversedExt = reversedName.slice(0, dotIndex)
    return reverseString(reversedExt)
}

module.exports = getExt