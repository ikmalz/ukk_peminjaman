const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status( ).json({
      message: "Token tidak ditemukan, silahkan login",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Token tidak valid",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        message: "Token tidak valid atau sudah kadaluarsa",
      });
    }

    req.user = decoded;
    next();
  });
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Akses ditolak, hanya admin yang boleh mengakses",
    });
  }
  next();
};

exports.isPetugas = (req, res, next) => {
  if (req.user.role !== "petugas") {
    return res.status(403).json({
      message: "Akses ditolak, hanya petugas yang boleh mengakses",
    });
  }
  next();
};

exports.isPeminjam = (req, res, next) => {
  if (req.user.role !== "peminjam") {
    return res.status(403).json({
      message: "Akses ditolak, hanya peminjam yang boleh mengakses",
    });
  }
  next();
};

exports.isAdminOrPetugas = (req, res, next) => {
  const role = req.user?.role;

  if (role === 'admin' || role === 'petugas') {
    return next();
  }

  return res.status(403).json({ 
    message: 'Akses ditolak. Hanya Admin dan Petugas yang diperbolehkan.' 
  });
};