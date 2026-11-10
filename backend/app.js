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
const appointmentRoutes = require("./routes/appointmentRoutes");
const adminSpecialtyRoutes = require("./routes/adminSpecialtyRoutes");
const adminDoctorRoutes = require("./routes/adminDoctorRoutes");
const adminAppointmentRoutes = require("./routes/adminAppointmentRoutes");
const adminStatsRoutes = require("./routes/adminStatsRoutes");

const app = express();

// The host (Render) puts one proxy in front of this server. Trusting it lets the
// rate limiter see each visitor's real address instead of the proxy's address.
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

// Only our frontend may call this API from a browser.
// A trailing slash is removed, because browsers send the origin without one.
const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
app.use(cors({ origin: frontendUrl }));

// Read JSON bodies, but refuse very large ones
app.use(express.json({ limit: "10kb" }));

// Home and health check (used by the host to see that the server is alive)
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

// Patient routes (the router itself requires login and the PATIENT role)
app.use("/api/appointments", appointmentRoutes);

// Admin routes: one guard protects everything under /api/admin
app.use("/api/admin", authenticate, requireRole("ADMIN"));
app.use("/api/admin/specialties", adminSpecialtyRoutes);
app.use("/api/admin/doctors", adminDoctorRoutes);
app.use("/api/admin/appointments", adminAppointmentRoutes);
app.use("/api/admin/stats", adminStatsRoutes);

// These two must stay last
app.use(notFound);
app.use(errorHandler);

module.exports = app;