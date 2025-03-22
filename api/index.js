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
    
    let definition = "";
    
    // Attempt JSON‑LD extraction first
    const ldScriptMatch = text.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    if (ldScriptMatch) {
      try {
        const jsonLD = JSON.parse(ldScriptMatch[1]);
        if (Array.isArray(jsonLD)) {
          for (const obj of jsonLD) {
            if (
              obj["@id"] &&
              obj["@id"].toLowerCase() === `https://dle.rae.es/${word.toLowerCase()}`
            ) {
              definition = obj.description || "";
              break;
            }
          }
        } else if (
          typeof jsonLD === "object" &&
          jsonLD["@id"] &&
          jsonLD["@id"].toLowerCase() === `https://dle.rae.es/${word.toLowerCase()}`
        ) {
          definition = jsonLD.description || "";
        }
      } catch (e) {
        // ignore JSON parsing errors
      }
    }
    
    // Fallback to meta description if JSON-LD is empty or only digits
    if (!definition || definition.trim() === "" || /^\d+$/.test(definition.trim())) {
      const metaMatch = text.match(/<meta\s+name="description"\s+content="([^"]+)"\/?>/i);
      if (metaMatch) {
        definition = metaMatch[1].trim();
      }
    }
    
    // If the definition still appears invalid (e.g. just "1"), use a fallback:
    if (!definition || /^\d+$/.test(definition.trim())) {
      // Try to extract the first <li> element with class "j"
      const liMatch = text.match(/<li[^>]*class="[^"]*\bj\b[^"]*"[^>]*>([\s\S]*?)<\/li>/i);
      if (liMatch) {
        // Remove HTML tags
        let rawDef = liMatch[1].replace(/<[^>]+>/g, ' ').trim();
        // Remove any leading numbering and markers (like "1. f." or "1. m. y f.")
        rawDef = rawDef.replace(/^\d+\.\s*[mf\.]*\s*/i, '');
        definition = rawDef;
      }
    }
    
    // Optionally, you might want to further split by a period and take the first sentence:
    if (definition) {
      const sentences = definition.split(/\. +/);
      definition = sentences[0].trim();
    }
    
    return res.json({ word, definition });
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};
