export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  const API_TOKEN = process.env.APIFY_TOKEN;

  if (!API_TOKEN) return res.status(500).json({ error: "Missing APIFY_TOKEN" });

  try {
    const startRes = await fetch(`https://api.apify.com/v2/acts/streamers~youtube-video-downloader/runs?token=${API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videos: [{ url }] })
    });

    const startData = await startRes.json();
    const runId = startData.data?.id;

    if (!runId) {
      return res.status(500).json({ error: "Failed to start run", details: startData });
    }

    let items = [];
    for (let i = 0; i < 18; i++) {
      await new Promise(r => setTimeout(r, 4000));

      const statusRes = await fetch(`https://api.apify.com/v2/acts/streamers~youtube-video-downloader/runs/${runId}?token=${API_TOKEN}`);
      const statusData = await statusRes.json();

      if (statusData.data?.status === "SUCCEEDED") {
        const itemsRes = await fetch(`https://api.apify.com/v2/acts/streamers~youtube-video-downloader/runs/${runId}/dataset/items?token=${API_TOKEN}`);
        items = await itemsRes.json();
        break;
      }
    }

    const videoData = items[0] || {};
    
    // Try multiple possible download URL fields
    const downloadUrl = videoData.downloadUrl || 
                       videoData.directDownloadUrl || 
                       videoData.url || 
                       videoData.videoUrl;

    return res.json({ 
      success: true, 
      data: videoData,
      downloadUrl: downloadUrl,
      allKeys: Object.keys(videoData)  // for debugging
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
