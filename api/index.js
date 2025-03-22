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

    // 1. Attempt to extract from JSON‑LD first.
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
        // Ignore JSON parsing errors.
      }
    }
    
    // If the JSON‑LD result is missing or is only digits (like "1"), fallback:
    if (!definition || definition.trim() === "" || /^\d+$/.test(definition.trim())) {
      const metaMatch = text.match(/<meta\s+name="description"\s+content="([^"]+)"\/?>/i);
      if (metaMatch) {
        definition = metaMatch[1].trim();
      }
    }
    
    // At this point, definition might be something like:
    // "1. f. Edificio para habitar. Una casa de ocho plantas. 2. f. Edificio de una o pocas plantas destinado a vivienda unifamiliar, ..."
    
    // 2. Remove a leading marker. We'll try to remove patterns like "1. f." or "m. y f." at the beginning.
    // The pattern below looks for one or more digits, a period, optional whitespace, then either "f." or "m. y f." (case insensitive).
    definition = definition.replace(/^\d+\.\s*(?:m\. ?y ?f\.|[mf]\.?)\s*/i, '').trim();

    // 3. Now, extract only the first sentence.
    // We'll assume that the definition ends at the first period that is followed by a space and an uppercase letter (which indicates a new sentence).
    const sentenceMatch = definition.match(/^([^\.]+)\./);
    if (sentenceMatch) {
      definition = sentenceMatch[1].trim();
    }
    
    // If after our cleaning the definition is still empty or just digits, fallback to a generic message.
    if (!definition || /^\d+$/.test(definition)) {
      definition = "Definition not found.";
    }
    
    return res.json({ word, definition });
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};
