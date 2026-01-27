import express from "express";
import cors from "cors";

import { CreateTables } from "./config/CreateTables.js";

// routes (to be added later)
import complaintRoutes from "./routes/complaint.routes.js";
import otpRoutes from "./routes/otp.registration.routes.js";
// import officerRoutes from "./routes/officer.routes.js";
import authRoutes from "./routes/auth.routes.js";
import trackingOtpRoutes from "./routes/otp.tracking.routes.js";

import translateRoutes from "./routes/translate.routes.js";

const app = express();
const port = 3001;

// middlewares
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.set("trust proxy", 1);

// create tables on startup (demo-safe)
CreateTables();
app.use("/api/translate", translateRoutes);
// routes
app.use("/api/registration", otpRoutes);
app.use("/api/complaints", complaintRoutes);
// app.use("/api/officer", officerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/otp", trackingOtpRoutes);


// health check (optional but good for demo)
app.get("/", (req, res) => {
  res.send("India Post Complaint Backend Running");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
