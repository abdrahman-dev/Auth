const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes.js');
const connectDB = require('./config/db.js');
const errorHandler = require('./middleware/errorHandler');
const cookieParser = require("cookie-parser");


dotenv.config();
connectDB();

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(errorHandler());
app.use('/auth', authRoutes);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});