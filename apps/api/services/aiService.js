const MODEL_SERVICE_URL = process.env.MODEL_SERVICE_URL || "http://127.0.0.1:8001";
const MODEL_SERVICE_TIMEOUT_MS = Number(process.env.MODEL_SERVICE_TIMEOUT_MS || 15000);

export async function callModelService({ type, sourceType, source, threshold }, maxRetries = 2) {
  let attempt = 0;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MODEL_SERVICE_TIMEOUT_MS);

    try {
      const response = await fetch(`${MODEL_SERVICE_URL}/infer/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_type: sourceType,
          source,
          threshold,
        }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data?.detail || `Model service failed (${response.status})`;
        throw new Error(message);
      }

      if (!data?.result || typeof data.result !== "object") {
        throw new Error("Model service returned an invalid response schema.");
      }

      return {
        result: data.result,
        provider: data?.provider || "model-service",
        serviceStatus: data?.status || "ok",
      };
    } catch (err) {
      attempt++;
      console.warn(`⚠️ AI Service attempt ${attempt} failed: ${err.message}`);
      if (attempt > maxRetries) {
        throw new Error(`AI Model Service request failed after ${maxRetries + 1} attempts: ${err.message}`);
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    } finally {
      clearTimeout(timeout);
    }
  }
}

export async function verifyModelServiceHealth() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5 sec timeout for check
  try {
    const response = await fetch(`${MODEL_SERVICE_URL}/health`, { signal: controller.signal });
    if (response.ok) {
      const data = await response.json();
      return data.status === "ok";
    }
    return false;
  } catch (err) {
    console.error("AI Service Health Check Error:", err.message);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
