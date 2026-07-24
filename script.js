document.getElementById("downloadBtn").addEventListener("click", async () => {
  const urlInput = document.getElementById("urlInput").value.trim();
  const status = document.getElementById("status");
  const resultDiv = document.getElementById("result");

  if (!urlInput) {
    status.textContent = "❌ Please enter a URL";
    return;
  }

  status.textContent = "🚀 Processing...";
  resultDiv.innerHTML = "";

  try {
    const response = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlInput })
    });

    const result = await response.json();

    if (result.success) {
      const downloadUrl = result.downloadUrl || result.data?.downloadUrl || result.data?.directDownloadUrl || "#";

      status.textContent = "✅ Success!";
      resultDiv.innerHTML = `
        <p><strong>YouTube Short</strong></p>
        ${downloadUrl !== "#" ? 
          `<a href="${downloadUrl}" target="_blank" download class="download-btn">⬇️ Download Video</a>` : 
          `<p style="color:orange;">No direct download link found. Try another Short.</p>`
        }
      `;
    } else {
      status.textContent = "❌ " + (result.error || "Unknown error");
    }
  } catch (err) {
    status.textContent = "❌ Network error";
    console.error(err);
  }
});
