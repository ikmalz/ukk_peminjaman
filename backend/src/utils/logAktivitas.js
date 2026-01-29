const db = require("../config/db");

async function logAktivitas({
  id_user,
  aktivitas,
  id_peminjaman = null,
  id_pengembalian = null,
}) {
  await db.query(
    `
    INSERT INTO log_aktivitas
    (id_user, aktivitas, id_peminjaman, id_pengembalian, waktu)
    VALUES ($1,$2,$3,$4,NOW())
    `,
    [id_user, aktivitas, id_peminjaman, id_pengembalian]
  );
}

module.exports = logAktivitas;
