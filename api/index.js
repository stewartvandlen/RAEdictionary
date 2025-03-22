app.get("/api/define", async (req, res) => {
  const word = req.query.word;
  
  if (!word) {
    return res.status(400).json({ error: "No word provided" });
  }

  const raeUrl = `https://dle.rae.es/${encodeURIComponent(word)}`;
  
  try {
    const response = await fetch(raeUrl, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
      },
    });

    if (!response.ok) {
      return res.status(500).json({ error: "Failed to fetch from RAE" });
    }

    const text = await response.text();

    // For debugging: return the full HTML response for now.
    res.send(text);
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

module.exports = app;
