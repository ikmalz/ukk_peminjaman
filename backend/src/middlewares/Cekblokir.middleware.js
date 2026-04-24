const db = require("../config/db");

const cekBlokir = async (req, res, next) => {
  const id_user = req.user?.id_user;
  if (!id_user) return next();

  try {
    const result = await db.query(
      `SELECT is_blocked, alasan_blokir FROM users WHERE id_user = $1`,
      [id_user]
    );

    if (result.rows[0]?.is_blocked) {
      return res.status(403).json({
        message: "Akun Anda diblokir karena memiliki denda yang melewati batas waktu pembayaran. Segera lunasi denda untuk dapat melakukan peminjaman kembali.",
        alasan: result.rows[0].alasan_blokir,
        is_blocked: true,
      });
    }

    next();
  } catch (err) {
    console.error("CEK BLOKIR ERROR:", err);
    next(); 
  }
};

module.exports = cekBlokir;