require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const { apiLimiter } = require("./middleware/rateLimiters");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const authenticate = require("./middleware/authenticate");
const requireRole = require("./middleware/requireRole");
const authRoutes = require("./routes/authRoutes");
const specialtyRoutes = require("./routes/specialtyRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const adminSpecialtyRoutes = require("./routes/adminSpecialtyRoutes");
const adminDoctorRoutes = require("./routes/adminDoctorRoutes");

const app = express();

// Security headers
app.use(helmet());

// Only our frontend may call this API from a browser
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

// Read JSON bodies, but refuse very large ones
app.use(express.json({ limit: "10kb" }));

// Home and health check
app.get("/", (req, res) => {
  res.send("ClinicBook API is running");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// All /api routes share the general rate limit
app.use("/api", apiLimiter);

// Public and auth routes
app.use("/api/auth", authRoutes);
app.use("/api/specialties", specialtyRoutes);
app.use("/api/doctors", doctorRoutes);

// Admin routes: one guard protects everything under /api/admin
app.use("/api/admin", authenticate, requireRole("ADMIN"));
app.use("/api/admin/specialties", adminSpecialtyRoutes);
app.use("/api/admin/doctors", adminDoctorRoutes);

// These two must stay last
app.use(notFound);
app.use(errorHandler);

module.exports = app;