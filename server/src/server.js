const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const db = require("./config/db");

const responseRoutes = require("./routes/responseRoutes");
const optionRoutes = require("./routes/optionRoutes");
const questionRoutes = require("./routes/questionRoutes");
const formRoutes = require("./routes/formRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/questions", questionRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/options", optionRoutes);
app.use("/api/responses", responseRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Student Form App API is running",
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT 1 AS result"
    );

    res.json({
      message:
        "MySQL database connected successfully",
      data: rows,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});