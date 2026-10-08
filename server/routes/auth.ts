import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { dbStore } from '../db.ts';
import { generateToken, authenticateToken, type AuthRequest } from '../auth.ts';
import type {  User  } from '../../src/types/index.ts';

const router = Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'Name, email, password, and phone number are required' });
    }

    const existingUser = dbStore.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      role: 'user',
      created_at: new Date().toISOString()
    };

    dbStore.addUser(newUser);

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      depot_id: newUser.depot_id
    });

    const { password: _, ...safeUser } = newUser;
    return res.status(201).json({ user: safeUser, token, message: 'Account created successfully' });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to create user account' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = dbStore.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      depot_id: user.depot_id
    });

    const { password: _, ...safeUser } = user;
    return res.json({ user: safeUser, token, message: 'Logged in successfully' });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal login error' });
  }
});

// Current user profile
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  const user = dbStore.getUsers().find(u => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { password: _, ...safeUser } = user;
  return res.json({ user: safeUser });
});

export default router;
