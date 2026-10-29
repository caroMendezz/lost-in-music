require("dotenv").config();
const nodemailer = require("nodemailer");

// ⚠️ Las credenciales van en el .env (nunca en el código):
//   MAIL_USER=tu_cuenta@gmail.com
//   MAIL_PASS=la_contraseña_de_aplicación_de_16_caracteres
const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS;

if (!MAIL_USER || !MAIL_PASS) {
  console.warn(
    "⚠️  Faltan MAIL_USER / MAIL_PASS en el .env: el envío de correos va a fallar."
  );
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
});

transporter.MAIL_USER = MAIL_USER;

module.exports = transporter;


// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "asan.santiagoet36@gmail.com",
//     pass: "icvg siiz kkqj raos",
//   },
// });

// module.exports = transporter;