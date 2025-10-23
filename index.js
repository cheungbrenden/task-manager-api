import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createUser, getUsers, loginUser } from './db.js';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';

const SALTROUNDS = 10

// TODO: use express.Router() to organize my routes once I have a lot more
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const authMiddleware = (req, res, next) => {

  const authorization = req.headers.authorization
  if (!authorization) {
    return res.status(401).json({ error: "Token missing" })
  }

  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Malformed token" })
  }

  const token = authorization.replace('Bearer ', '')

  try {

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decodedToken
    // console.log(req.user)
    next()

  } catch (err) {
    const errorName = err.name
    if (errorName == 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired" });
    }
    if (errorName == 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    }

    return res.status(500).json({ error: "Internal server error" })

  }

}

app.get('/', (req, res) => {
  res.json({ message: 'Task Manager API is running!' });
});

app.get('/tasks', authMiddleware, (req, res) => {
  console.log(req.user)
  res.json({ message: 'Task page is running!' });

});

app.get('/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.send(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching users" });
  }
})



app.post('/register', async (req, res) => {
  try {
    // TODO: put constraints on username, email, password

    const { username, email, password } = req.body
    const hashedPassword = await bcrypt.hash(password, SALTROUNDS)

    const userInfo = {
      username,
      email,
      password: hashedPassword
    }

    const newUser = await createUser(userInfo)
    res.status(201).json({ userId: newUser.user_id, username: newUser.username, email: newUser.email });


  } catch (err) {
    if (err.code == 23505) {
      if (err.constraint == 'unique_username') {
        return res.status(400).json({ error: "Username already exists" })
      }
      if (err.constraint == 'unique_email') {
        return res.status(400).json({ error: "Email already exists" })
      }
    }

    res.status(500).json({ error: "Internal server error" });

  }
})

app.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body

    if (!usernameOrEmail) {
      return res.status(400).json({ error: 'Username/email not provided' })
    }
    else if (!password) {
      return res.status(400).json({ error: 'Password not provided' })
    }

    const user = await loginUser(usernameOrEmail)
    const checkPassword = (user
      ? await bcrypt.compare(password, user.password)
      : null)

    if (!user || !checkPassword) {
      return res.status(401).json({ error: 'Username/email or password is incorrect' });
    }

    const tokenData = {
      username: user.username,
      id: user.user_id
    }

    const token = jwt.sign(tokenData, process.env.JWT_SECRET, { expiresIn: '15m' })
    return res.status(200).json({ token, username: user.username });


  } catch (err) {
    res.status(500).send({ error: "Internal server error" });
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
