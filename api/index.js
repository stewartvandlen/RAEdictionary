const fetch = require("node-fetch");

module.exports = async (req, res) => {
  const { word } = req.query;
  if (!word) {
    return res.status(400).json({ error: "No word provided" });
  }

  const raeUrl = `https://dle.rae.es/${encodeURIComponent(word)}`;
  
  try {
    const response = await fetch(raeUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
      }
    });
    
    if (!response.ok) {
      return res.status(500).json({ error: "Failed to fetch from RAE" });
    }
    
    const text = await response.text();
    
    // Use regex to extract the definition text.
    // This regex looks for the content inside a <p class="j"> ... </p> tag.
    const match = text.match(/<p class="j">([\s\S]*?)<\/p>/);
    const definition = match
      ? match[1].replace(/<[^>]+>/g, '').trim()  // Remove any HTML tags and trim whitespace
      : "Definition not found.";
    
    res.json({ word, definition });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
