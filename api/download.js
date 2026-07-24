export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  const API_TOKEN = process.env.APIFY_TOKEN;

  if (!API_TOKEN) {
    return res.status(500).json({ error: "APIFY_TOKEN not set in Vercel" });
  }

  try {
    const response = await fetch(`https://api.apify.com/v2/acts/streamers~youtube-video-downloader/runs?token=${API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videos: [{ url }]
      })
    });

    const data = await response.json();
    const runId = data.data?.id;

    if (!runId) {
      return res.status(500).json({ error: "Failed to start download", details: data });
    }

    // Return run ID - user can check manually for now
    return res.json({ 
      success: true, 
      message: "Run started. Check Apify console or try again in 20 seconds.",
      runId 
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
