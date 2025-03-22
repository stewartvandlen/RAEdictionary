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
    
    // Attempt to extract JSON-LD script content
    const ldScriptMatch = text.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    let definition = null;
    if (ldScriptMatch) {
      try {
        const jsonLD = JSON.parse(ldScriptMatch[1]);
        // If jsonLD is an array, iterate through it.
        if (Array.isArray(jsonLD)) {
          for (const obj of jsonLD) {
            if (obj["@id"] && obj["@id"].toLowerCase() === `https://dle.rae.es/${word.toLowerCase()}`) {
              definition = obj.description;
              break;
            }
          }
        } else if (typeof jsonLD === "object" && jsonLD["@id"] && jsonLD["@id"].toLowerCase() === `https://dle.rae.es/${word.toLowerCase()}`) {
          definition = jsonLD.description;
        }
      } catch (e) {
        // JSON parsing failed; fallback later
      }
    }
    
    // Fallback: if JSON-LD extraction failed, try the meta tag approach
    if (!definition) {
      const metaMatch = text.match(/<meta\s+name="description"\s+content="([^"]+)"\/?>/i);
      if (metaMatch) {
        definition = metaMatch[1].trim();
      }
    }
    
    if (definition) {
      // Remove common leading markers. For example, remove "m. y f." or "1. f." at the start.
      definition = definition.replace(/^(m\. ?y ?f\.|(\d+\.\s*f\.))\s*/i, '');
      
      // Now, if the definition includes multiple numbered parts, split on a number marker like "2."
      // We assume the first definition is the core definition.
      const parts = definition.split(/\d+\./);
      definition = parts[0].trim();
      
      return res.json({ word, definition });
    } else {
      return res.json({ word, definition: "Definition not found." });
    }
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};
