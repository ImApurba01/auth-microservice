import express from "express";
import morgan from "morgan";
import cors from "cors"
import pool from "./config/db";
import dotenv from "dotenv"
import authRouter from "./routes/auth.routes";
import errorHandler from "./middlewares/errorHandler";
import createUserTable from "./data/createUserTable"
import cookieParser from "cookie-parser"
import createSessionTable from "./data/createSessionTable";
import type { Request, Response, NextFunction } from "express";

dotenv.config();


const app = express();


//Testing postgres connection
app.get("/health", async (req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "healthy" });
  } catch (err: unknown) {
    if(err instanceof Error){
      res.status(500).json({ status: "unhealthy", error: err.message });
    }
    else {
    console.error("Caught non-Error value:", err);
  }
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