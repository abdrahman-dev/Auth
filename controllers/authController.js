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
        res.status(500).send("Server error");
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
            return res.status(400).send("Wrong credentials");
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

        user.refreshTokens.push(refreshToken);
        await user.save();

        res.json({ accessToken, refreshToken });

    } catch (err) {
        res.status(500).send("Server error");
    }
};

exports.refreshToken = async (req, res) => {
    const { token } = req.body;

    if (!token) return res.sendStatus(401);

    const user = await User.findOne({ refreshTokens: token });

    if (!user) return res.sendStatus(403);

    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err) return res.sendStatus(403);

        const accessToken = jwt.sign(
            { id: user._id, username: user.username },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        );

        res.json({ accessToken });
    });
};

exports.logout = async (req, res) => {
    const { token } = req.body;

    const user = await User.findOne({ refreshTokens: token });

    if (!user) return res.sendStatus(204);

    user.refreshTokens = user.refreshTokens.filter(t => t !== token);
    await user.save();

    res.sendStatus(204);
};

exports.dashboard = (req, res) => {
    res.json({
        message: "Welcome to dashboard",
        user: req.user
    });
};

