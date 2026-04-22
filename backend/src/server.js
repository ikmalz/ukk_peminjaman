require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const kategoriRoutes = require("./routes/kategori.routes");
const alatRoutes = require("./routes/alat.routes");
const peminjamanRoutes = require("./routes/peminjaman.routes");
const pengembalianRoutes = require("./routes/pengembalian.routes");
const logRoutes = require("./routes/log.routes");
const dendaRoutes = require("./routes/denda.routes");
const autoCancelPeminjaman = require('./utils/autoCancelPeminjaman');

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

autoCancelPeminjaman();

console.log('✅ Auto Cancel Peminjaman Scheduler aktif (jalan setiap jam 02:00)');

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROUTES
app.use("/api/auth", authRoutes);
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

server.listen(PORT, () => {
  console.log(`server berjalan di http://localhost:${PORT}`);
});