import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

export const createUser = async (userInfo) => {

    const query = {
        text: 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
        values: [userInfo.username, userInfo.email, userInfo.password]
    }
    const newUser = await pool.query(query)
    return newUser.rows[0]
    
}

export const getUsers = async (limit = 10) => {
    const query = {
        text: 'SELECT * FROM users LIMIT $1',
        values: [limit]
    }
    const res = await pool.query(query)
    return res.rows
}
