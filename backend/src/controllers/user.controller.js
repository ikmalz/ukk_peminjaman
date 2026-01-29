const db = require("../config/db");
const bcrypt = require("bcrypt");

exports.createUser = async (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({
      message: "Nama, email, dan role wajib diisi",
    });
  }

  if (role !== "petugas" && role !== "peminjam") {
    return res.status(400).json({
      message: "Role hanya boleh petugas atau peminjam",
    });
  }

  try {
    const defaultPassword = "123456";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const query = `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id_user
    `;

    const result = await db.query(query, [name, email, passwordHash, role]);

    res.json({
      message: "User berhasil ditambahkan",
      user: {
        id_user: result.rows[0].id_user,
        name,
        email,
        role,
        password_default: defaultPassword,
      },
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({
        message: "Email sudah terdaftar",
      });
    }

    console.error(err);
    res.status(500).json({
      message: "Gagal menambahkan user",
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT id_user, name, email, role, status, created_at
      FROM users
      ORDER BY id_user DESC
    `;

    const result = await db.query(query);

    res.json({
      message: "Data user berhasil diambil",
      data: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil data user",
    });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT id_user, name, email, role, status
      FROM users
      WHERE id_user = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    res.json({
      message: "Detail user",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil data user",
    });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({
      message: "Nama, email, dan role wajib diisi",
    });
  }

  try {
    const query = `
      UPDATE users
      SET name = $1, email = $2, role = $3
      WHERE id_user = $4
    `;

    await db.query(query, [name, email, role, id]);

    res.json({
      message: "Data user berhasil diperbarui",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengubah data user",
    });
  }
};

exports.updateStatusUser = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const query = `
      UPDATE users
      SET status = $1
      WHERE id_user = $2
    `;

    await db.query(query, [status, id]);

    res.json({
      message: "Status user berhasil diperbarui",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengubah status user",
    });
  }
};
