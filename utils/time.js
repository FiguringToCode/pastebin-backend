function getCurrentTime(req) {
    if(process.env.TEST_MODE === '1'){
        const testNow = req.headers['x-test-now-ms']
        if(testNow){
            return parseInt(testNow)
        }
    }   
    return Date.now()
}



function isExpired(paste, currentTime) {
    if(!paste.ttl_seconds) return false
    const expiresAt = paste.createdAt = paste.createdAt + (paste.ttl_seconds * 1000)
    return currentTime >= expiresAt
}



function getExpiresAt(paste) {
    if(!paste.ttl_seconds) return null
    return new Date(paste.createdAt + (paste.ttl_seconds * 1000)).toISOString()
}


module.exports = { getCurrentTime, isExpired, getExpiresAt }