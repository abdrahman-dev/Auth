import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No access token provided"
            });
        }

        const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
        req.user = { userId: decoded.userId };

        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: "Access token expired"
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid access token"
        });
    }
};