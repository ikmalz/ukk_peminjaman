require("dotenv").config();
const db = require("../config/db");
const bcrypt = require("bcrypt");

async function seedAdmin() {
  try {
    const passwordHash = await bcrypt.hash("123456", 10);

    const users = [
      {
        name: "Admin UKK",
        email: "admin@ukk.com",
        password: passwordHash,
        role: "admin",
      },
      {
        name: "Petugas UKK",
        email: "petugas@ukk.com",
        password: passwordHash,
        role: "petugas",
      },
    ];

    for (const user of users) {
      const query = `
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO NOTHING
      `;

      await db.query(query, [
        user.name,
        user.email,
        user.password,
        user.role,
      ]);

      console.log(`User ${user.role} berhasil dibuat / sudah ada`);
    }

    console.log("Seeder admin & petugas selesai 🔥");
    process.exit();
  } catch (err) {
    console.error("Seeder gagal:", err);
    process.exit(1);
  }
}

seedAdmin();