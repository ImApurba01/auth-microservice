import express from "express";
import morgan from "morgan";
import cors from "cors"
import pool from "./config/db.ts";
import dotenv from "dotenv"
import authRouter from "./routes/auth.routes.ts";
import errorHandler from "./middlewares/errorHandler.ts";
import createUserTable from "./data/createUserTable.ts"
import cookieParser from "cookie-parser"
import createSessionTable from "./data/createSessionTable.ts";

dotenv.config();


const app = express();

//Testing postgres connection
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "healthy" });
  } catch (err) {
    res.status(500).json({ status: "unhealthy", error: err.message });
  }
});

(async () => {
  try {
    await pool.connect();
    console.log("Connected to DB");
    //Create tables before starting server
    await createUserTable();
    await createSessionTable();
  } catch (err) {
    console.error("DB init error:", err);
    process.exit(1);
  }
})();

//Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(cookieParser());

//Routes
app.use("/api/auth", authRouter);


//Error Handling Middlewares
app.use(errorHandler);




const port = process.env.PORT;

app.listen(port, () => {
    console.log(`Server is running on port : ${port}`)
})
export default app;