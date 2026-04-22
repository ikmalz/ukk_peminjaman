const cron = require('node-cron');
const db = require('../config/db');
const logAktivitas = require('./logAktivitas');

const autoCancelPeminjaman = () => {
  console.log('⏰ Auto Cancel Scheduler diaktifkan - Setiap hari pukul 02:00');

  cron.schedule('0 2 * * *', async () => {
    console.log('🔄 Menjalankan Auto Cancel Peminjaman...');

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      const result1 = await client.query(`
        UPDATE peminjaman 
        SET status = 'batal',
            keterangan_batal = 'Otomatis dibatalkan: tidak diverifikasi dalam 2 hari',
            updated_at = NOW()
        WHERE status = 'menunggu'
          AND tgl_pinjam < NOW() - INTERVAL '2 days'
        RETURNING id_peminjaman, id_user;
      `);

      const result2 = await client.query(`
        UPDATE peminjaman 
        SET status = 'batal',
            keterangan_batal = 'Otomatis dibatalkan: tidak diambil dalam 2 hari setelah disetujui',
            updated_at = NOW()
        WHERE status = 'disetujui'
          AND status_pengambilan = 'belum_diambil'
          AND updated_at < NOW() - INTERVAL '2 days'
        RETURNING id_peminjaman, id_user;
      `);

      await client.query('COMMIT');

      if (result1.rows.length > 0) {
        console.log(`✅ ${result1.rows.length} peminjaman 'menunggu' dibatalkan otomatis`);
        for (const p of result1.rows) {
          await logAktivitas({
            id_user: p.id_user,
            aktivitas: `Peminjaman ID ${p.id_peminjaman} dibatalkan otomatis (tidak diverifikasi > 2 hari)`,
            id_peminjaman: p.id_peminjaman
          });
        }
      }

      if (result2.rows.length > 0) {
        console.log(`✅ ${result2.rows.length} peminjaman disetujui tapi tidak diambil dibatalkan`);
      }

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Error pada auto cancel:', err);
    } finally {
      client.release();
    }
  });
};

module.exports = autoCancelPeminjaman;