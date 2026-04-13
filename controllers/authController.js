const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/user.js');

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;

        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(409).send("Username already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            password: hashedPassword
        });

        await user.save();

        res.status(201).send("User created");

    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).send("User not found");
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            throw Object.assign(new Error("Invalid username or password"), { status: 400 });
        }

        const accessToken = jwt.sign(
            { id: user._id, username: user.username },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.REFRESH_TOKEN_SECRET
        );

        const hashedToken = await bcrypt.hash(refreshToken, 10);

user.refreshTokens.push(hashedToken);
await user.save();

        res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 15 * 60 * 1000
});

res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict"
});

res.json({ success: true });

    } catch (err) {
        next(err);
    }
};

exports.refreshToken = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) throw { status: 401, message: "Unauthorized" };

        const user = await User.findOne();
        if (!user) throw { status: 403 };

        let matchedToken = null;

        for (let t of user.refreshTokens) {
            const match = await bcrypt.compare(token, t);
            if (match) {
                matchedToken = t;
                break;
            }
        }

        if (!matchedToken) throw { status: 403 };

        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

        // 🔥 ROTATION
        user.refreshTokens = user.refreshTokens.filter(t => t !== matchedToken);

        const newRefreshToken = jwt.sign(
            { id: user._id },
            process.env.REFRESH_TOKEN_SECRET
        );

        const hashed = await bcrypt.hash(newRefreshToken, 10);
        user.refreshTokens.push(hashed);

        await user.save();

        const accessToken = jwt.sign(
            { id: user._id, username: user.username },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        );

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "Strict"
        });

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "Strict"
        });

        res.json({ success: true });

    } catch (err) {
        next(err);
    }
};

exports.logout = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;

        if (!token) return res.sendStatus(204);

        const user = await User.findOne();

        user.refreshTokens = [];

        await user.save();

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        res.sendStatus(204);

    } catch (err) {
        next(err);
    }
};

exports.dashboard = (req, res) => {
    res.json({
        message: "Welcome to dashboard",
        user: req.user
    });
};

