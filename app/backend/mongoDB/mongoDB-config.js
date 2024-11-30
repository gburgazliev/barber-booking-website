const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("please set up your mongodb env variable");
}

const client = new MongoClient(uri, {
  tls: true,
  tlsInsecure: false,
});

const clientPromise = client.connect();

module.exports = {clientPromise};
