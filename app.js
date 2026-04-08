const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes.js');
const connectDB = require('./config/db.js');


dotenv.config();
connectDB();

const app = express();

app.use(express.json());

app.use('/auth', authRoutes);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});