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
      body: JSON.stringify({ videos: [{ url: url }] })
    });

    const startData = await startRes.json();
    const runId = startData.data?.id;

    if (!runId) {
      return res.status(500).json({ error: "Failed to start", details: startData });
    }

    let items = [];
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 4500));

      const statusRes = await fetch(`https://api.apify.com/v2/acts/streamers~youtube-video-downloader/runs/${runId}?token=${API_TOKEN}`);
      const status = (await statusRes.json()).data?.status;

      if (status === "SUCCEEDED") {
        const itemsRes = await fetch(`https://api.apify.com/v2/acts/streamers~youtube-video-downloader/runs/${runId}/dataset/items?token=${API_TOKEN}`);
        items = await itemsRes.json();
        break;
      }
    }

    const video = items[0] || {};
    
    // Extract best possible download URL
    const downloadUrl = video.downloadUrl || 
                       video.directDownloadUrl || 
                       video.highestQualityUrl || 
                       video.url || 
                       video.videoUrl || 
                       video.contentUrl;

    return res.json({
      success: true,
      downloadUrl: downloadUrl,
      title: video.title,
      rawData: video   // for debugging
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
