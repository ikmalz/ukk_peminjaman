const db = require ('../config/db');
const bcrypt = require ('bcrypt');
const jwt = require ('jsonwebtoken');

exports.login = async (req, res) => {
  const {email, password} = req.body;

  if (!email || !password) {
    return res.status (400).json ({message: 'Email dan password wajib diisi'});
  }

  try {
    const query = 'SELECT * FROM users WHERE email = $1 LIMIT 1';
    const result = await db.query (query, [email]);

    if (result.rows.length === 0) {
      return res.status (401).json ({message: 'Email tidak terdaftar'});
    }

    const user = result.rows[0];

    if (user.status === 2) {
      return res.status (403).json ({
        message: 'Akun Anda sedang menunggu aktivasi oleh admin',
        code: 'PENDING_ACTIVATION',
      });
    }

    if (user.status !== 1) {
      return res.status (403).json ({
        message: 'Akun Anda telah dinonaktifkan. Hubungi admin',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    const isMatch = await bcrypt.compare (password, user.password);

    if (!isMatch) {
      return res.status (401).json ({message: 'Password salah'});
    }

    const token = jwt.sign (
      {id_user: user.id_user, role: user.role},
      process.env.JWT_SECRET,
      {expiresIn: '1d'}
    );

    res.json ({
      message: 'Login berhasil',
      token,
      user: {
        id_user: user.id_user,
        name: user.name,
        email: user.email,
        role: user.role,
        force_password_change: user.force_password_change,
      },
    });
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Terjadi kesalahan server'});
  }
};

exports.register = async (req, res) => {
  const {name, email, password} = req.body;

  if (!name || !email || !password) {
    return res
      .status (400)
      .json ({message: 'Nama, email, dan password wajib diisi'});
  }

  if (password.length < 6) {
    return res.status (400).json ({message: 'Password minimal 6 karakter'});
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test (email)) {
    return res.status (400).json ({message: 'Format email tidak valid'});
  }

  try {
    const existing = await db.query (
      'SELECT id_user FROM users WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status (400).json ({message: 'Email sudah terdaftar'});
    }

    const passwordHash = await bcrypt.hash (password, 10);

    await db.query (
      `INSERT INTO users (name, email, password, role, status, force_password_change)
       VALUES ($1, $2, $3, 'peminjam', 2, false)`,
      [name, email, passwordHash]
    );

    res.status (201).json ({
      message: 'Pendaftaran berhasil! Akun Anda sedang menunggu aktivasi oleh admin.',
    });
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Gagal mendaftar, coba lagi'});
  }
};
