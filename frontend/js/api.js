import { APP_CONFIG } from "./config.js";

const configured = () => {
  const url = APP_CONFIG.webAppUrl.trim();
  return url.startsWith("https://script.google.com/macros/s/") && url.endsWith("/exec");
};

const withTimeout = async (promise, timeoutMs = APP_CONFIG.requestTimeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await promise(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

const parseResponse = async (response) => {
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Respons server bukan JSON yang valid.");
  }

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || `Permintaan gagal (${response.status}).`);
  }

  return payload;
};

const jsonp = (params) => new Promise((resolve, reject) => {
  const callbackName = `birthdayJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const script = document.createElement("script");
  const timeout = setTimeout(() => cleanup(new Error("JSONP timeout.")), APP_CONFIG.requestTimeoutMs);

  const cleanup = (error, data) => {
    clearTimeout(timeout);
    delete window[callbackName];
    script.remove();
    error ? reject(error) : resolve(data);
  };

  window[callbackName] = (data) => {
    if (data?.ok === false) cleanup(new Error(data.message || "Permintaan gagal."));
    else cleanup(null, data);
  };

  const url = new URL(APP_CONFIG.webAppUrl);
  Object.entries({ ...params, callback: callbackName, key: APP_CONFIG.publicAccessKey }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });
  script.src = url.toString();
  script.onerror = () => cleanup(new Error("Gagal memuat data JSONP."));
  document.head.appendChild(script);
});

export const api = {
  isConfigured: configured,

  async get(action, params = {}) {
    if (!configured()) throw new Error("Apps Script belum dikonfigurasi.");

    const url = new URL(APP_CONFIG.webAppUrl);
    Object.entries({ action, ...params, key: APP_CONFIG.publicAccessKey }).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    });

    try {
      return await withTimeout(async (signal) => {
        const response = await fetch(url, {
          method: "GET",
          mode: "cors",
          cache: "no-store",
          credentials: "omit",
          signal
        });
        return parseResponse(response);
      });
    } catch (error) {
      console.warn("Fetch GET gagal, mencoba JSONP:", error);
      return jsonp({ action, ...params });
    }
  },

  async post(action, data = {}) {
    if (!configured()) throw new Error("Apps Script belum dikonfigurasi.");

    const payload = {
      action,
      key: APP_CONFIG.publicAccessKey,
      ...data
    };

    try {
      return await withTimeout(async (signal) => {
        const response = await fetch(APP_CONFIG.webAppUrl, {
          method: "POST",
          mode: "cors",
          cache: "no-store",
          credentials: "omit",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
          signal
        });
        return parseResponse(response);
      });
    } catch (error) {
      // Sebagian deployment Apps Script menolak pembacaan respons lintas-origin,
      // tetapi tetap menerima request. Fallback ini mengirim data secara no-cors.
      console.warn("POST CORS gagal, mencoba no-cors:", error);
      await fetch(APP_CONFIG.webAppUrl, {
        method: "POST",
        mode: "no-cors",
        cache: "no-store",
        credentials: "omit",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      return {
        ok: true,
        accepted: true,
        message: "Data telah dikirim dan menunggu verifikasi server."
      };
    }
  }
};
