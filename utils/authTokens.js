import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user._id },
        env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    );
}

export const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user._id },
        env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
}
