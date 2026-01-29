const db = require("../config/db");

exports.getAllLog = async (req, res) => {
  const result = await db.query(`
    SELECT 
      l.id_log,
      u.name AS user,
      l.aktivitas,
      l.id_peminjaman,
      l.id_pengembalian,
      l.waktu
    FROM log_aktivitas l
    JOIN users u ON l.id_user = u.id_user
    ORDER BY l.waktu DESC
  `);

  res.json(result.rows);
};
