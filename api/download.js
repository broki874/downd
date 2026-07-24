export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  const API_TOKEN = process.env.APIFY_TOKEN;   // ← Changed

  if (!API_TOKEN) {
    return res.status(500).json({ error: "Missing APIFY_TOKEN environment variable" });
  }

  const ACTOR = "easyapi/youtube-shorts-downloader";

  try {
    const startRes = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs?token=${API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ links: [url] })
    });

    const startData = await startRes.json();
    const runId = startData.data.id;

    for (let i = 0; i < 12; i++) {
      await new Promise(r => setTimeout(r, 4000));

      const runRes = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs/${runId}?token=${API_TOKEN}`);
      const runData = await runRes.json();

      if (runData.data.status === "SUCCEEDED") {
        const itemsRes = await fetch(`https://api.apify.com/v2/acts/${ACTOR}/runs/${runId}/dataset/items?token=${API_TOKEN}`);
        const items = await itemsRes.json();

        return res.status(200).json({ success: true, data: items[0] });
      }

      if (runData.data.status === "FAILED" || runData.data.status === "ABORTED") {
        return res.status(500).json({ error: "Apify run failed" });
      }
    }

    return res.status(408).json({ error: "Timeout" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}