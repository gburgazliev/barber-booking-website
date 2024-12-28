const secret = process.env.JWT_SECRET;
const jwt = require("jsonwebtoken");

const signJWT = (userObject) => {
    
    const token = jwt.sign({...userObject}, secret, {expiresIn: '1h'});
   return token;
}

module.exports = signJWT;