require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const kategoriRoutes = require("./routes/kategori.routes");
const alatRoutes = require("./routes/alat.routes");
const peminjamanRoutes = require("./routes/peminjaman.routes");
const pengembalianRoutes = require("./routes/pengembalian.routes");
const logRoutes = require("./routes/log.routes");
const dendaRoutes = require("./routes/denda.routes");
const app = express()

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes);
app.use("/api/kategori", kategoriRoutes);
app.use("/api/alat", alatRoutes);
app.use("/api/peminjaman", peminjamanRoutes);
app.use("/api/pengembalian", pengembalianRoutes);
app.use("/api/log", logRoutes);
app.use("/api/denda", dendaRoutes);
app.use('/uploads', express.static('uploads'))

app.get("/", (req, res) => {
    res.send("API UKK Peminjaman Alat berjalan");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`server berjalan di http://localhost:${PORT}`);
})