import pool from "../config/db"


const createUserTable = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
    )`;

    try{
        pool.query(queryText);
        console.log("User table created if not exists");
    }catch(err){
        console.log("Error creating users table : ", err);
    }
}

export default createUserTable