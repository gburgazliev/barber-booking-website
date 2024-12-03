const secret = process.env.JWT_SECRET;
const jwt = require("jsonwebtoken");

const signJWT = (userObject) => {
    const { email, firstname, lastname, role } = userObject;
    const token = jwt.sign({email, firstname, lastname, role}, secret, {expiresIn: '1h'});
   return token;
}

module.exports = signJWT;