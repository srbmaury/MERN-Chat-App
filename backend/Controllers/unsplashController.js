const fetch = require('node-fetch');
const dotenv = require("dotenv");

dotenv.config();

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

async function searchPhotos(req, res) {
    const { query } = req.query;
    const apiUrl = `https://api.unsplash.com/search/photos?page=1&per_page=15&query=${query}&order_by=relevant&client_id=${ACCESS_KEY}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Extract image links from the response
        const imageLinks = data.results.map((photo) => photo.urls.regular);

        res.status(200).json({ imageLinks });
    } catch (error) {
        console.error('Error fetching image links:', error);
        res.status(500).json({ error: 'Error fetching image links' });
    }
}

module.exports = { searchPhotos };
