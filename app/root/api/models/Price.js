const { mongoose } = require("../mongoDB/mongoDB-config");

const PriceSchema = new mongoose.Schema({
    type: { type: String, enum: ["Hair", "Hair and Beard", "Beard"], required: true },
    price: { type: Number, required: true },
    });

const Price = mongoose.model("Price", PriceSchema);

module.exports = Price;