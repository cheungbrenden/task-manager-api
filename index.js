import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createUser, getUsers } from './db.js';
import bcrypt from 'bcrypt'

const SALTROUNDS = 10

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Task Manager API is running!');
});

app.get('/users', async (req, res) => {
  try {
    const users = await getUsers(); 
    res.send(users);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching users");
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
    res.status(201).send({ userId: newUser.user_id, username: newUser.username, email: newUser.email });


  } catch (err) {
    if (err.code == 23505) {
      if (err.constraint == 'unique_username') {
        return res.status(400).send({ error: "Username already exists"})
      }
      if (err.constraint == 'unique_email') {
        return res.status(400).send({ error: "Email already exists"})
      }
      

    }

    res.status(500).send({ error: "Internal server error" });
    
  }
  
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
