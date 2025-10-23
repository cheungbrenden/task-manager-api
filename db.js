import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

export const createUser = async (userInfo) => {

    const { username, email, password } = userInfo


    const query = {
        text: 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
        values: [username, email, password]
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

export const loginUser = async (usernameOrEmail) => {

    const isUsername = !usernameOrEmail.includes('@')

    const query = isUsername
        ? { text: 'SELECT * FROM users WHERE username = $1 LIMIT 1', values: [usernameOrEmail]}
        : { text: 'SELECT * FROM users WHERE email = $1 LIMIT 1', values: [usernameOrEmail]}

    const result = await pool.query(query)
    return result.rows[0]
    
}