const fetch = require("node-fetch");

module.exports = async (req, res) => {
  // Get the query parameter "word"
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
    // For debugging: return the HTML text
    res.setHeader("Content-Type", "text/html");
    res.send(text);
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
