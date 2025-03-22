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
    
    // Extract the meta description content using regex
    const metaMatch = text.match(/<meta\s+name="description"\s+content="([^"]+)"\/?>/i);
    if (metaMatch) {
      let metaContent = metaMatch[1].trim();
      
      // Remove leading abbreviation patterns.
      // Check if it starts with "m. y f." (which is common for "perro")
      if (/^m\. ?y ?f\./i.test(metaContent)) {
        metaContent = metaContent.replace(/^m\. ?y ?f\.\s*/i, '');
      } else if (/^1\.\s*f\./i.test(metaContent)) {
        metaContent = metaContent.replace(/^1\.\s*f\.\s*/i, '');
      }
      
      // Now split the remaining text into sentences.
      // We assume that a period followed by a space is a sentence delimiter.
      const sentences = metaContent.split(/\. +/);
      let definition = sentences[0].trim();
      
      return res.json({ word, definition });
    } else {
      return res.json({ word, definition: "Definition not found." });
    }
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};
