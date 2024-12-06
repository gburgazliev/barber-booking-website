const express = require("express");
const cors = require("cors");
const mongoose = require('./mongoDB/mongoDB-config');
const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(cors()); 
app.use(express.json());
const port = process.env.PORT || 5000;
app.listen(port);

const UserRouter = require('./routes/users')

app.use("/api/users" , UserRouter)





