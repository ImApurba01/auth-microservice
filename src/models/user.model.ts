import pool from "../config/db";


export const registerUserService = async (
    name:string,
    email:string,
    phone:string,
    password:string
) =>{
    const result = await pool.query("INSERT INTO users (name, email, phone, password) VALUES ($1, $2, $3, $4) RETURNING *", 
        [name, email, phone, password]);
        return result.rows[0]   
}

export const getUserService = async (decoded: any) => {
    const result = await pool.query("SELECT id, name, email, phone FROM users where id = $1", [decoded.id]);
    return result.rows[0];
}

export const loginUserService = async (email:string) =>{
    const result = await pool.query("SELECT * FROM users where email = $1", [email]);
    return result.rows[0];
}