const express = require('express');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
const bcrypt = require('bcrypt');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database configuration
const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'medical_passport',
    port: process.env.DB_PORT || 5432
});

// Connect to database
client.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
    } else {
        console.log('Connected to PostgreSQL database.');
    }
});

// Middleware to check admin token
function authenticateAdmin(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ message: 'No token provided.' });
    }

    try {
        const bearerToken = token.split(' ')[1];
        const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
        if (!decoded.isAdmin) {
            return res.status(403).json({ message: 'Requires admin privileges.' });
        }
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
}

// Middleware to check any valid token (admin or regular user)
function authenticateUser(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ message: 'No token provided.' });
    }

    try {
        const bearerToken = token.split(' ')[1];
        const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.isAdmin = decoded.isAdmin || false;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
}

// Admin Registration Route
app.post('/api/admin/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Check if username already exists
        const existingUser = await client.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Username already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await client.query(
            'INSERT INTO users (username, password, is_admin) VALUES ($1, $2, true) RETURNING id',
            [username, hashedPassword]
        );

        res.status(201).json({ 
            message: 'Admin registered successfully.',
            userId: result.rows[0].id
        });
    } catch (err) {
        console.error('Error registering admin:', err);
        res.status(500).json({ 
            message: 'Error registering admin. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// User Registration Route
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Check if username already exists
        const existingUser = await client.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Username already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await client.query(
            'INSERT INTO users (username, password, is_admin) VALUES ($1, $2, false) RETURNING id',
            [username, hashedPassword]
        );

        res.status(201).json({ 
            message: 'User registered successfully.',
            userId: result.rows[0].id
        });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ 
            message: 'Error registering user. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Admin Login Route
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const result = await client.query(
            'SELECT * FROM users WHERE username = $1 AND is_admin = true',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Admin not found.' });
        }

        const admin = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password.' });
        }

        const token = jwt.sign(
            { userId: admin.id, isAdmin: true },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ 
            token,
            userId: admin.id,
            role: 'admin'
        });
    } catch (err) {
        console.error('Error during admin login:', err);
        res.status(500).json({ 
            message: 'Error during login. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// User Login Route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'User not found.' });
        }

        const user = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password.' });
        }

        const token = jwt.sign(
            { userId: user.id, isAdmin: user.is_admin },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ 
            token,
            userId: user.id,
            role: user.is_admin ? 'admin' : 'user'
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ 
            message: 'Error during login. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Route for adding doctors (admin only)
app.post('/api/doctors', authenticateAdmin, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Check if doctor username already exists
        const existingDoctor = await client.query('SELECT id FROM doctors WHERE username = $1', [username]);
        if (existingDoctor.rows.length > 0) {
            return res.status(400).json({ message: 'Doctor username already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await client.query(
            'INSERT INTO doctors (username, password) VALUES ($1, $2) RETURNING id',
            [username, hashedPassword]
        );

        res.status(201).json({ 
            message: 'Doctor added successfully.',
            doctorId: result.rows[0].id
        });
    } catch (err) {
        console.error('Error adding doctor:', err);
        res.status(500).json({ 
            message: 'Error adding doctor. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Doctor Login Route
app.post('/api/doctor/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const result = await client.query('SELECT * FROM doctors WHERE username = $1', [username]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Doctor not found.' });
        }

        const doctor = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, doctor.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password.' });
        }

        const token = jwt.sign(
            { userId: doctor.id, isDoctor: true },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ 
            token,
            doctorId: doctor.id,
            role: 'doctor'
        });
    } catch (err) {
        console.error('Error during doctor login:', err);
        res.status(500).json({ 
            message: 'Error during login. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Patient Routes
app.get('/api/patients', authenticateUser, async (req, res) => {
    try {
        let result;
        if (req.isAdmin) {
            // Admins can see all patients
            result = await client.query('SELECT * FROM patients');
        } else {
            // Regular users can only see their own data
            result = await client.query('SELECT * FROM patients WHERE user_id = $1', [req.userId]);
        }
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching patient data:', err);
        res.status(500).json({ 
            message: 'Error fetching patient data.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

app.post('/api/patients', authenticateUser, async (req, res) => {
    const { name, age, condition, passport_id } = req.body;

    if (!name || !age || !condition || !passport_id) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const result = await client.query(
            'INSERT INTO patients (user_id, name, age, condition, passport_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.userId, name, age, condition, passport_id]
        );

        res.status(201).json({
            message: 'Patient data saved successfully.',
            patient: result.rows[0]
        });
    } catch (err) {
        console.error('Error saving patient data:', err);
        res.status(500).json({ 
            message: 'Error saving patient data.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`Medical passport app listening on http://0.0.0.0:${port}`);
});