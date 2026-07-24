export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  const API_TOKEN = process.env.APIFY_TOKEN;

  if (!API_TOKEN) {
    return res.status(500).json({ error: "Missing APIFY_TOKEN" });
  }

  const ACTOR = "easyapi/youtube-shorts-downloader";

  try {
    // Start Run
    const startRes = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ links: [url] })
    });

    const startData = await startRes.json();

    if (!startData.data || !startData.data.id) {
      return res.status(500).json({ error: "Failed to start Apify run", details: startData });
    }

    const runId = startData.data.id;

    // Polling
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 5000));

      const runRes = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs/${runId}?token=${API_TOKEN}`);
      const runData = await runRes.json();

      const status = runData.data?.status;

      if (status === "SUCCEEDED") {
        const itemsRes = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs/${runId}/dataset/items?token=${API_TOKEN}`);
        const items = await itemsRes.json();

        return res.status(200).json({ 
          success: true, 
          data: items[0] || { error: "No data returned" } 
        });
      }

      if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
        return res.status(500).json({ error: `Run ${status}`, details: runData });
      }
    }

    return res.status(408).json({ error: "Request timeout" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
