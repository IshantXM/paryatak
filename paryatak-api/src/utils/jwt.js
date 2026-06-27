const jwt = require('jsonwebtoken');

const generateTokens = (userId, email, role) => {
    const accessToken = jwt.sign(
        { userId, email, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );
    const refreshToken = jwt.sign(
        { userId, email, role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
    return { accessToken, refreshToken };
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = { generateTokens, verifyRefreshToken };
