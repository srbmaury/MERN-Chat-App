const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

async function searchPhotos(req, res) {
    const { query } = req.query;
    if (!query || !ACCESS_KEY) return res.status(400).json({ error: 'Query or Unsplash configuration missing' });
    const params = new URLSearchParams({
        page: "1",
        per_page: "15",
        query: String(query).slice(0, 100),
        order_by: "relevant",
        client_id: ACCESS_KEY,
    });
    const apiUrl = `https://api.unsplash.com/search/photos?${params}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (!response.ok) throw new Error(data.errors?.join(", ") || "Unsplash request failed");

        // Extract image links from the response
        const imageLinks = data.results.map((photo) => photo.urls.regular);

        res.status(200).json({ imageLinks });
    } catch (error) {
        console.error('Error fetching image links:', error);
        res.status(500).json({ error: 'Error fetching image links' });
    }
}

module.exports = { searchPhotos };
