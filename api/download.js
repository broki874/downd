export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  const API_TOKEN = process.env.APIFY_TOKEN;

  if (!API_TOKEN) return res.status(500).json({ error: "Missing APIFY_TOKEN" });

  try {
    // Using a reliable YouTube Video Downloader that supports Shorts
    const startRes = await fetch(`https://api.apify.com/v2/acts/streamers~youtube-video-downloader/runs?token=${API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videos: [{ url: url }]
      })
    });

    const startData = await startRes.json();

    if (!startData.data?.id) {
      return res.status(500).json({ 
        error: "Failed to start Apify run", 
        details: startData 
      });
    }

    const runId = startData.data.id;

    // Polling
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 4000));

      const statusRes = await fetch(`https://api.apify.com/v2/acts/streamers~youtube-video-downloader/runs/${runId}?token=${API_TOKEN}`);
      const statusData = await statusRes.json();
      const status = statusData.data?.status;

      if (status === "SUCCEEDED") {
        const itemsRes = await fetch(`https://api.apify.com/v2/acts/streamers~youtube-video-downloader/runs/${runId}/dataset/items?token=${API_TOKEN}`);
        const items = await itemsRes.json();

        return res.json({ success: true, data: items[0] || items });
      }

      if (status === "FAILED" || status === "ABORTED") {
        return res.status(500).json({ error: `Run failed: ${status}` });
      }
    }

    return res.status(408).json({ error: "Timeout" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
