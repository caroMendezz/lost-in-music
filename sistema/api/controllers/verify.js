const crypto = require("crypto");
const transporter = require("../config/mailer");


const codes = new Map();


const SendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requerido" });

    // Generar un código de 6 dígitos
    const code = crypto.randomInt(100000, 999999);

    // Guardar el código temporalmente (expira en 5 minutos)
    codes.set(email, { code, expiresAt: Date.now() + 5 * 60 * 1000 });

    // Enviar el correo
    await transporter.sendMail({
      from: `"Verificación" <asan.santiagoet36@gmail.com>`,
      to: email,
      subject: "Código de verificación",
      html: `
        <h2>Tu código es: ${code}</h2>
        <p>Expira en 5 minutos.</p>
      `,
    });

    console.log(`✅ Código ${code} enviado a ${email}`);
    res.json({ message: "Código enviado al correo." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al enviar código." });
  }
};

/**
 * Verifica que el código sea correcto y no haya expirado
 */
const CheckVerificationCode = (req, res) => {
  const { email, code } = req.body;

  const entry = codes.get(email);
  if (!entry) return res.status(400).json({ message: "No hay código generado para este correo." });

  if (Date.now() > entry.expiresAt) {
    codes.delete(email);
    return res.status(400).json({ message: "Código expirado." });
  }

  if (entry.code.toString() !== code.toString()) {
    return res.status(400).json({ message: "Código incorrecto." });
  }

  // ✅ Si llega acá, es correcto
  codes.delete(email);
  res.json({ message: "Código verificado con éxito." });
};

module.exports = { SendVerificationCode, CheckVerificationCode };