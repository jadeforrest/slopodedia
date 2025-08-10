const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('.'));

// API endpoint to get all pages dynamically
app.get('/api/pages', (req, res) => {
    const pagesDir = path.join(__dirname, 'pages');
    
    try {
        const files = fs.readdirSync(pagesDir).filter(file => file.endsWith('.json'));
        const pages = [];
        
        files.forEach(file => {
            try {
                const filePath = path.join(pagesDir, file);
                const pageData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                pages.push(pageData);
            } catch (error) {
                console.error(`Error loading ${file}:`, error.message);
            }
        });
        
        res.json(pages);
    } catch (error) {
        console.error('Error reading pages directory:', error.message);
        res.status(500).json({ error: 'Failed to load pages' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🌀 Slopopedia server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`📄 Found ${getPageCount()} pages`);
});

function getPageCount() {
    try {
        const pagesDir = path.join(__dirname, 'pages');
        return fs.readdirSync(pagesDir).filter(file => file.endsWith('.json')).length;
    } catch (error) {
        return 0;
    }
}