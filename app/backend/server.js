const express = require("express");
const cors = require("cors");
const { clientPromise } = require("../backend/mongoDB/mongoDB-config");
const router = express.Router();
router.use(express.json())
const app = express();
app.use(cors()); 
app.use(express.json());
const port = 5000;
app.listen(port);
