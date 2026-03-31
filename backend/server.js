require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // Added for file paths
const db = require('./db');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow requests from our frontend
app.use(express.json()); // Parse JSON bodies

// Serve static frontend files (HTML, CSS, JS) from the root folder
app.use(express.static(path.join(__dirname, '..')));

// Initialize Database Table
const initDB = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        // Ensure phone column exists for existing tables
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='phone') THEN 
                    ALTER TABLE contacts ADD COLUMN phone VARCHAR(20); 
                END IF; 
            END $$;
        `);
        console.log('Database table initialized successfully.');
    } catch (err) {
        console.error('Error initializing database:', err.message);
        console.log('Note: Please ensure PostgreSQL is running and your .env credentials are correct.');
    }
};

initDB();

// Default Route
// (Root route removed to allow static file serving of index.html)

// Contact Form Endpoint
app.post('/api/contact', async (req, res) => {
    console.log('Received Message Data:', req.body); // DEBUG LOG
    try {
        const { name, email, phone, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Name, Email, and Message are required.' });
        }

        const newContact = await db.query(
            'INSERT INTO contacts (name, email, phone, message) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, email, phone || null, message]
        );

        res.status(201).json({ success: true, data: newContact.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error saving contact.' });
    }
});

// SECRET ADMIN ROUTE: View all messages in a clean table
app.get('/api/admin/contacts', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM contacts ORDER BY created_at DESC');
        
        // Generate a beautiful HTML table
        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin - Contact Messages</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0c0e14; color: #f8fafc; padding: 40px; }
                h1 { color: #38bdf8; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; }
                th, td { padding: 15px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }
                th { background: rgba(56, 189, 248, 0.1); color: #38bdf8; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 1px; }
                tr:hover { background: rgba(255,255,255,0.05); }
                .date { color: #94a3b8; font-size: 13px; }
            </style>
        </head>
        <body>
            <h1>📨 Contact Messages Dashboard</h1>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Message</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
        `;

        result.rows.forEach(msg => {
            html += `
                <tr>
                    <td><strong>${msg.name}</strong></td>
                    <td>${msg.email}</td>
                    <td>${msg.phone || 'N/A'}</td>
                    <td>${msg.message}</td>
                    <td class="date">${new Date(msg.created_at).toLocaleString()}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        </body>
        </html>
        `;

        res.send(html);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error retrieving messages.');
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
