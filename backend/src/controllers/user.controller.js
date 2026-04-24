const db = require ('../config/db');
const bcrypt = require ('bcrypt');

exports.createUser = async (req, res) => {
  const {name, email, role, password} = req.body;

  if (!name || !email || !role) {
    return res
      .status (400)
      .json ({message: 'Nama, email, dan role wajib diisi'});
  }

  if (role !== 'petugas' && role !== 'peminjam') {
    return res
      .status (400)
      .json ({message: 'Role hanya boleh petugas atau peminjam'});
  }

  try {
    const finalPassword = password && password.trim () !== ''
      ? password
      : '123456';
    const passwordHash = await bcrypt.hash (finalPassword, 10);

    const query = `
      INSERT INTO users (name, email, password, role, status, force_password_change)
      VALUES ($1, $2, $3, $4, 1, true)
      RETURNING id_user
    `;

    await db.query (query, [name, email, passwordHash, role]);

    res.json ({
      message: 'User berhasil ditambahkan',
      info: password && password.trim () !== ''
        ? 'Password ditentukan oleh admin'
        : 'Password default: 123456',
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status (400).json ({message: 'Email sudah terdaftar'});
    }
    console.error (err);
    res.status (500).json ({message: 'Gagal menambahkan user'});
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT id_user, name, email, role, status, created_at
      FROM users
      ORDER BY id_user DESC
    `;
    const result = await db.query (query);
    res.json ({message: 'Data user berhasil diambil', data: result.rows});
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Gagal mengambil data user'});
  }
};

exports.getPendingUsers = async (req, res) => {
  try {
    const query = `
      SELECT id_user, name, email, role, created_at
      FROM users
      WHERE status = 2
      ORDER BY created_at ASC
    `;
    const result = await db.query (query);
    res.json ({
      message: 'Data user pending berhasil diambil',
      data: result.rows,
      total: result.rows.length,
    });
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Gagal mengambil data user pending'});
  }
};

exports.activateUser = async (req, res) => {
  const {id} = req.params;

  try {
    const check = await db.query (
      'SELECT status, name FROM users WHERE id_user = $1',
      [id]
    );

    if (check.rows.length === 0) {
      return res.status (404).json ({message: 'User tidak ditemukan'});
    }

    if (check.rows[0].status !== 2) {
      return res
        .status (400)
        .json ({message: 'User ini tidak dalam status menunggu aktivasi'});
    }

    await db.query ('UPDATE users SET status = 1 WHERE id_user = $1', [id]);

    res.json ({message: `Akun "${check.rows[0].name}" berhasil diaktivasi`});
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Gagal mengaktivasi user'});
  }
};

exports.rejectUser = async (req, res) => {
  const {id} = req.params;

  try {
    const check = await db.query (
      'SELECT status, name FROM users WHERE id_user = $1',
      [id]
    );

    if (check.rows.length === 0) {
      return res.status (404).json ({message: 'User tidak ditemukan'});
    }

    if (check.rows[0].status !== 2) {
      return res
        .status (400)
        .json ({message: 'User ini tidak dalam status menunggu aktivasi'});
    }

    await db.query ('DELETE FROM users WHERE id_user = $1', [id]);

    res.json ({
      message: `Pendaftaran "${check.rows[0].name}" berhasil ditolak`,
    });
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Gagal menolak pendaftaran'});
  }
};

exports.getUserById = async (req, res) => {
  const {id} = req.params;
  try {
    const result = await db.query (
      'SELECT id_user, name, email, role, status FROM users WHERE id_user = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status (404).json ({message: 'User tidak ditemukan'});
    }
    res.json ({message: 'Detail user', data: result.rows[0]});
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Gagal mengambil data user'});
  }
};

exports.updateUser = async (req, res) => {
  const {id} = req.params;
  const {name, email, role} = req.body;

  if (!name || !email || !role) {
    return res
      .status (400)
      .json ({message: 'Nama, email, dan role wajib diisi'});
  }

  if (role !== 'petugas' && role !== 'peminjam') {
    return res
      .status (400)
      .json ({message: 'Role hanya boleh petugas atau peminjam'});
  }

  try {
    await db.query (
      'UPDATE users SET name = $1, email = $2, role = $3 WHERE id_user = $4',
      [name, email, role, id]
    );
    res.json ({message: 'Data user berhasil diperbarui'});
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Gagal mengubah data user'});
  }
};

exports.updateStatusUser = async (req, res) => {
  const {id} = req.params;
  const {status} = req.body;

  if (req.user.id_user == id) {
    return res
      .status (400)
      .json ({message: 'Tidak boleh mengubah status akun sendiri'});
  }

  try {
    await db.query ('UPDATE users SET status = $1 WHERE id_user = $2', [
      status,
      id,
    ]);
    res.json ({message: 'Status user berhasil diperbarui'});
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Gagal mengubah status user'});
  }
};

exports.resetPassword = async (req, res) => {
  const {id} = req.params;
  const defaultPassword = '123456';
  const hash = await bcrypt.hash (defaultPassword, 10);

  await db.query (
    'UPDATE users SET password = $1, force_password_change = true WHERE id_user = $2',
    [hash, id]
  );

  res.json ({
    message: 'Password berhasil direset',
    password_default: defaultPassword,
  });
};

exports.changePassword = async (req, res) => {
  const {oldPassword, newPassword} = req.body;
  const id = req.user.id_user;

  if (!oldPassword || !newPassword) {
    return res.status (400).json ({message: 'Password wajib diisi'});
  }

  const result = await db.query (
    'SELECT password FROM users WHERE id_user = $1',
    [id]
  );
  const match = await bcrypt.compare (oldPassword, result.rows[0].password);

  if (!match) {    
    return res.status (400).json ({message: 'Password lama salah'});
  }

  const hash = await bcrypt.hash (newPassword, 10);
  await db.query (
    'UPDATE users SET password = $1, force_password_change = false WHERE id_user = $2',
    [hash, id]
  );

  res.json ({message: 'Password berhasil diubah'});
};

exports.deleteUser = async (req, res) => {
  const {id} = req.params;

  if (req.user.id_user == id) {
    return res
      .status (400)
      .json ({message: 'Tidak boleh menghapus akun sendiri'});
  }

  try {
    const check = await db.query ('SELECT role FROM users WHERE id_user = $1', [
      id,
    ]);

    if (check.rows.length === 0) {
      return res.status (404).json ({message: 'User tidak ditemukan'});
    }

    if (check.rows[0].role === 'admin') {
      return res
        .status (403)
        .json ({message: 'Tidak bisa menghapus akun admin'});
    }

    await db.query ('DELETE FROM users WHERE id_user = $1', [id]);
    res.json ({message: 'User berhasil dihapus'});
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Gagal menghapus user'});
  }
};
