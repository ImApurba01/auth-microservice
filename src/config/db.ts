import pg from "pg"
import dotenv from "dotenv"

const { Pool } = pg;

dotenv.config();


console.log(process.env.DB_USER)
console.log(process.env.DB_PORT)

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD
})

// pool.on("connect", ()=> {
//     // console.log("Connection Pool has been established with DB")
//   console.log(
//     `Connection established: database=${pool.options.database}, host=${pool.options.host}, user=${pool.options.user}`
// )
// })

export default pool