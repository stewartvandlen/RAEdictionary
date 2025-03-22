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
    
    // Extract meta description using regex
    const metaMatch = text.match(/<meta\s+name="description"\s+content="([^"]+)"\/?>/i);
    if (metaMatch) {
      let metaContent = metaMatch[1].trim();
      // Remove the leading marker "1. f." if present
      metaContent = metaContent.replace(/^1\.\s*f\.\s*/i, '');
      // Split the string into sentences using the period as a delimiter
      const sentences = metaContent.split('.');
      // Take the first sentence (the definition) and trim any extra spaces
      let definition = sentences[0].trim();
      // If the first sentence is empty, set a fallback message
      if (!definition) {
        definition = "Definition not found.";
      }
      return res.json({ word, definition });
    } else {
      return res.json({ word, definition: "Definition not found." });
    }
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};
