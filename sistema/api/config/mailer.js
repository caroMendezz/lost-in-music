const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "asan.santiagoet36@gmail.com",
    pass: "icvg siiz kkqj raos",
  },
});

module.exports = transporter;