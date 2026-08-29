/**
 * Trinetra Gateway Proxy — Cloudflare Worker
 * Fixed: D1 atomic billing + tee streaming + retry hardening.
 */

async function hmacHex(key, secret) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(key));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

// --- Billing helpers: D1 primary, KV cache fallback ---
async function ensureBillingTable(env) {
  if (!env.TRINETRA_DB) return;
  try {
    await env.TRINETRA_DB.prepare("CREATE TABLE IF NOT EXISTS billing (key TEXT PRIMARY KEY, balance INTEGER)").run();
  } catch {}
}

async function getBalance(env, key) {
  // Try D1 first (atomic, strongly consistent)
  if (env.TRINETRA_DB) {
    try {
      await ensureBillingTable(env);
      const row = await env.TRINETRA_DB.prepare("SELECT balance FROM billing WHERE key = ?").bind(key).first();
      if (row) return parseFloat(row.balance);
    } catch {}
  }
  const v = await env.TRINETRA_BILLING.get(key);
  return v !== null ? parseFloat(v) : 0;
}

async function setBalance(env, key, balance) {
  const b = Math.max(0, Math.floor(balance)).toString();
  // Write D1 + KV (KV as read cache)
  if (env.TRINETRA_DB) {
    try {
      await env.TRINETRA_DB.prepare("INSERT INTO billing (key, balance) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET balance = excluded.balance").bind(key, parseInt(b)).run();
    } catch {}
  }
  try { await env.TRINETRA_BILLING.put(key, b); } catch {}
}

async function addBalance(env, key, delta) {
  delta = Math.floor(delta);
  if (env.TRINETRA_DB) {
    try {
      await ensureBillingTable(env);
      await env.TRINETRA_DB.prepare("INSERT INTO billing (key, balance) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET balance = balance + excluded.balance").bind(key, delta).run();
      const row = await env.TRINETRA_DB.prepare("SELECT balance FROM billing WHERE key = ?").bind(key).first();
      const bal = row ? parseFloat(row.balance) : delta;
      try { await env.TRINETRA_BILLING.put(key, Math.max(0, bal).toString()); } catch {}
      return bal;
    } catch {}
  }
  const cur = parseFloat((await env.TRINETRA_BILLING.get(key)) || "0");
  const next = cur + delta;
  await env.TRINETRA_BILLING.put(key, Math.max(0, next).toString());
  return next;
}

async function deductBalanceAtomic(env, key, cost) {
  cost = Math.floor(cost);
  if (env.TRINETRA_DB) {
    try {
      await ensureBillingTable(env);
      // Atomic deduct only if sufficient balance
      const res = await env.TRINETRA_DB.prepare("UPDATE billing SET balance = balance - ? WHERE key = ? AND balance >= ?").bind(cost, key, cost).run();
      // Cloudflare D1 run() returns meta.changes
      if (res.meta && res.meta.changes > 0) {
        const row = await env.TRINETRA_DB.prepare("SELECT balance FROM billing WHERE key = ?").bind(key).first();
        const bal = row ? parseFloat(row.balance) : 0;
        try { await env.TRINETRA_BILLING.put(key, bal.toString()); } catch {}
        return { ok: true, balance: bal };
      }
      // Check if key had 0 or insufficient
      const row = await env.TRINETRA_DB.prepare("SELECT balance FROM billing WHERE key = ?").bind(key).first();
      const bal = row ? parseFloat(row.balance) : 0;
      if (bal < cost) return { ok: false, balance: bal, reason: "insufficient" };
      return { ok: false, balance: bal };
    } catch {}
  }
  // KV fallback (eventual, but with compare)
  const cur = parseFloat((await env.TRINETRA_BILLING.get(key)) || "0");
  if (cur < cost) return { ok: false, balance: cur, reason: "insufficient" };
  const next = cur - cost;
  await env.TRINETRA_BILLING.put(key, Math.max(0, next).toString());
  return { ok: true, balance: Math.max(0, next) };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized: Missing or invalid token', { status: 401 });
    }
    
    let customerKey = authHeader.replace('Bearer ', '').trim();
    if (customerKey.includes('.') && env.HMAC_SECRET) {
      const [k, h] = customerKey.split('.');
      const expected = await hmacHex(k, env.HMAC_SECRET);
      if (!timingSafeEqual(h.toLowerCase(), expected.toLowerCase())) {
        return new Response('Unauthorized: HMAC invalid', { status: 401 });
      }
      customerKey = k;
    }

    const PRICING = {
      "gpt-4o": {
        inputPer1K: parseFloat(env.PRICE_GPT4O_INPUT_PER_1K || "10"),
        outputPer1K: parseFloat(env.PRICE_GPT4O_OUTPUT_PER_1K || "30"),
        minCharge: parseFloat(env.PRICE_GPT4O_MIN || "5")
      },
      "gpt-4o-mini": {
        inputPer1K: parseFloat(env.PRICE_MINI_INPUT_PER_1K || "2"),
        outputPer1K: parseFloat(env.PRICE_MINI_OUTPUT_PER_1K || "6"),
        minCharge: parseFloat(env.PRICE_MINI_MIN || "2")
      },
      "glm-5.3": {
        inputPer1K: parseFloat(env.PRICE_GLM_INPUT_PER_1K || "3"),
        outputPer1K: parseFloat(env.PRICE_GLM_OUTPUT_PER_1K || "9"),
        minCharge: parseFloat(env.PRICE_GLM_MIN || "3")
      },
      "default": {
        inputPer1K: parseFloat(env.PRICE_DEFAULT_INPUT_PER_1K || "5"),
        outputPer1K: parseFloat(env.PRICE_DEFAULT_OUTPUT_PER_1K || "15"),
        minCharge: parseFloat(env.PRICE_DEFAULT_MIN || "5")
      }
    };

    function getPricing(model) {
      const m = (model || "").toLowerCase();
      if (m.includes("gpt-4o-mini")) return PRICING["gpt-4o-mini"];
      if (m.includes("glm-5.3") || m.includes("glm-5")) return PRICING["glm-5.3"];
      if (m.includes("gpt-4o") || m.includes("gpt")) return PRICING["gpt-4o"];
      if (m.includes("kimi") || m.includes("moonshot")) return { inputPer1K: 5, outputPer1K: 15, minCharge: 3 };
      if (m.includes("glm")) return PRICING["glm-5.3"];
      return PRICING["default"];
    }

    function calcCost(usage, model) {
      if (!usage) return null;
      const pricing = getPricing(model);
      const prompt = usage.prompt_tokens ?? usage.promptTokens ?? 0;
      const completion = usage.completion_tokens ?? usage.completionTokens ?? 0;
      const total = usage.total_tokens ?? usage.totalTokens ?? (prompt + completion);
      let p = prompt, c = completion;
      if (!prompt && !completion && total) { p = Math.floor(total/2); c = total - p; }
      const cost = Math.ceil((p/1000) * pricing.inputPer1K + (c/1000) * pricing.outputPer1K);
      return Math.max(pricing.minCharge, cost || pricing.minCharge);
    }

    if (request.method === 'GET' && url.pathname === '/v1/billing/balance') {
      const balance = await getBalance(env, customerKey);
      return new Response(JSON.stringify({
        config: { prepaidBalance: { val: balance }, creditUsagePercent: balance > 0 ? 0 : 100, isUnifiedBillingUser: true }
      }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }

    if (request.method === 'GET' && url.pathname === '/v1/billing/pricing') {
      return new Response(JSON.stringify({ pricing: PRICING }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST' && url.pathname === '/v1/billing/topup') {
      try {
        const body = await request.json();
        const targetKey = body.key || customerKey;
        const amount = parseInt(body.amount || 0);
        if (amount <= 0) return new Response(JSON.stringify({ error: "amount must be >0" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        const next = await addBalance(env, targetKey, amount);
        const prev = next - amount;
        return new Response(JSON.stringify({ key: targetKey.slice(0,8)+"...", previous: prev, added: amount, balance: next }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } catch(e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      let dbOk = false;
      if (env.TRINETRA_DB) {
        try { await env.TRINETRA_DB.prepare("SELECT 1").first(); dbOk = true; } catch {}
      }
      return new Response(JSON.stringify({ ok: true, db: dbOk, kv: !!env.TRINETRA_BILLING, azure: !!env.AZURE_OPENAI_ENDPOINT }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // POST /v1/billing/create-checkout — Stripe Checkout Session
    if (request.method === 'POST' && url.pathname === '/v1/billing/create-checkout') {
      try {
        if (!env.STRIPE_SECRET_KEY) return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        const body = await request.json();
        const priceId = body.priceId || body.price_id;
        // Map frontend priceId to Stripe Price ID or amount
        const priceMap = {
          "price_pro": env.STRIPE_PRICE_PRO || null,   // e.g. price_123
          "price_team": env.STRIPE_PRICE_TEAM || null,
        };
        let stripePrice = priceMap[priceId];
        let amount = null;
        let credits = 0;
        if (priceId === "price_pro") { amount = 1900; credits = 2000; }
        else if (priceId === "price_team") { amount = 4900; credits = 6000; }
        if (!amount && !stripePrice) return new Response(JSON.stringify({ error: "Unknown priceId" }), { status: 400, headers: { 'Content-Type': 'application/json' } });

        const successUrl = body.successUrl || "https://code.hystersis.com/?paid=1";
        const cancelUrl = body.cancelUrl || "https://code.hystersis.com/#pricing";

        // Create Stripe Checkout Session via API
        const params = new URLSearchParams();
        params.append("mode", "subscription");
        params.append("success_url", successUrl + (successUrl.includes("?") ? "&" : "?") + "session_id={CHECKOUT_SESSION_ID}&key=" + encodeURIComponent(customerKey));
        params.append("cancel_url", cancelUrl);
        params.append("client_reference_id", customerKey);
        params.append("metadata[trinetra_key]", customerKey);
        params.append("metadata[credits]", String(credits));
        if (stripePrice) {
          params.append("line_items[0][price]", stripePrice);
          params.append("line_items[0][quantity]", "1");
        } else {
          params.append("line_items[0][price_data][currency]", "usd");
          params.append("line_items[0][price_data][product_data][name]", priceId === "price_pro" ? "Hystersis Pro — 2,000 credits" : "Hystersis Team — 6,000 credits");
          params.append("line_items[0][price_data][unit_amount]", String(amount));
          params.append("line_items[0][price_data][recurring][interval]", "month");
          params.append("line_items[0][quantity]", "1");
        }

        const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString()
        });
        const stripeData = await stripeRes.json();
        if (!stripeRes.ok) return new Response(JSON.stringify({ error: stripeData.error?.message || "Stripe error", detail: stripeData }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify({ url: stripeData.url, id: stripeData.id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } catch(e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // POST /v1/billing/stripe-webhook — Stripe webhook to top up on payment
    if (request.method === 'POST' && url.pathname === '/v1/billing/stripe-webhook') {
      try {
        const sig = request.headers.get('stripe-signature') || "";
        // Note: verify signature if STRIPE_WEBHOOK_SECRET set (optional for now)
        const bodyText = await request.text();
        const event = JSON.parse(bodyText);
        if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {
          const session = event.data.object;
          const key = session.client_reference_id || session.metadata?.trinetra_key;
          const credits = parseInt(session.metadata?.credits || (session.amount_total ? Math.floor(session.amount_total/0.95) : 0));
          // Pro=2000, Team=6000 fallback
          let add = credits;
          if (!add) {
            if (session.amount_total === 1900) add = 2000;
            else if (session.amount_total === 4900) add = 6000;
            else add = Math.floor((session.amount_total||0)/0.95);
          }
          if (key && add > 0) {
            await addBalance(env, key, add);
            console.log(`[stripe] topped up ${key.slice(0,8)} +${add} via ${event.type}`);
          }
        }
        return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } catch(e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (request.method === 'POST' && url.pathname === '/v1/chat/completions') {
      const balance = await getBalance(env, customerKey);
      if (balance <= 0) {
        return new Response(JSON.stringify({ error: { message: "Payment Required: Insufficient balance", code: 402 } }), { status: 402, headers: { 'Content-Type': 'application/json' } });
      }

      const bodyText = await request.text();
      let reqBody = {};
      try { reqBody = JSON.parse(bodyText); } catch(e) {}
      if (reqBody.stream === true) {
        reqBody.stream_options = { include_usage: true };
      }
      let upstreamBody = bodyText;
      try {
        if (reqBody && typeof reqBody === 'object' && Object.keys(reqBody).length) {
          upstreamBody = JSON.stringify(reqBody);
        }
      } catch {}

      const requestedModel = reqBody.model || "gpt-4o";
      const isStream = !!reqBody.stream;
      
      let upstreamUrl = "";
      let headers = { 'Content-Type': 'application/json' };

      const getRandomKey = (keyString) => {
        if (!keyString) return "";
        const keys = keyString.split(',').map(k => k.trim()).filter(Boolean);
        return keys.length ? keys[Math.floor(Math.random() * keys.length)] : "";
      };

      const normalizeEndpoint = (ep) => ep ? ep.replace(/\/+$/, '') : "";

      // Build upstream URL — support multiple Azure deployments + fallbacks
      const azureEndpoints = (env.AZURE_OPENAI_ENDPOINT || "").split(',').map(s => s.trim()).filter(Boolean);
      const primaryAzure = azureEndpoints[0] || "";

      if (requestedModel.includes("gpt")) {
        if (!primaryAzure) {
          return new Response(JSON.stringify({ error: { message: "AZURE_OPENAI_ENDPOINT not configured - run deploy_model.sh", code: "missing_endpoint" } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        let ep = primaryAzure;
        if (ep.includes("/openai/deployments")) {
          upstreamUrl = normalizeEndpoint(ep.split('?')[0]) + (ep.includes('?') ? '?' + ep.split('?').slice(1).join('?') : '');
          upstreamUrl = upstreamUrl.replace('com//openai', 'com/openai');
        } else {
          upstreamUrl = normalizeEndpoint(ep) + "/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview";
        }
        const azureKey = getRandomKey(env.AZURE_OPENAI_KEY);
        if (!azureKey) {
          return new Response(JSON.stringify({ error: { message: "AZURE_OPENAI_KEY not configured", code: "missing_key" } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        headers['api-key'] = azureKey;
      } else if (requestedModel.includes("kimi") || requestedModel.includes("moonshot")) {
        upstreamUrl = "https://api.moonshot.cn/v1/chat/completions";
        headers['Authorization'] = `Bearer ${getRandomKey(env.MOONSHOT_API_KEYS)}`;
      } else if (requestedModel.includes("glm") || requestedModel.includes("chatglm") || requestedModel.includes("glm-5")) {
        upstreamUrl = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
        headers['Authorization'] = `Bearer ${getRandomKey(env.GLM_API_KEYS)}`;
      } else {
        upstreamUrl = "https://api.novita.ai/v3/openai/chat/completions";
        headers['Authorization'] = `Bearer ${getRandomKey(env.NOVITA_API_KEY)}`;
      }

      if (!upstreamUrl) {
        return new Response(JSON.stringify({ error: { message: "No upstream URL for " + requestedModel, code: "no_upstream" } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }

      async function fetchWithRetry(url, opts, retries=3) {
        for (let i=0; i<retries; i++) {
          try {
            const resp = await fetch(url, opts);
            if (resp.status !== 429 || i === retries-1) return resp;
            const retryAfter = resp.headers.get('retry-after') || resp.headers.get('x-ratelimit-reset-requests') || Math.pow(2, i);
            const delay = Math.min(10000, parseInt(retryAfter)*1000 || (1000 * Math.pow(2, i)));
            await new Promise(r => setTimeout(r, delay));
          } catch(e) {
            if (i === retries-1) throw e;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
          }
        }
      }

      let aiResponse;
      try {
        aiResponse = await fetchWithRetry(upstreamUrl, {
          method: 'POST',
          headers: headers,
          body: upstreamBody
        });
        // Try secondary Azure endpoints on 429
        if (aiResponse.status === 429 && requestedModel.includes("gpt") && azureEndpoints.length > 1) {
          for (let idx = 1; idx < azureEndpoints.length; idx++) {
            let ep2 = azureEndpoints[idx];
            let url2 = ep2.includes("/openai/deployments") ? normalizeEndpoint(ep2.split('?')[0]) + (ep2.includes('?') ? '?' + ep2.split('?').slice(1).join('?') : '') : normalizeEndpoint(ep2) + "/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview";
            url2 = url2.replace('com//openai', 'com/openai');
            const retryResp = await fetchWithRetry(url2, { method: 'POST', headers: headers, body: upstreamBody });
            if (retryResp.ok || retryResp.status !== 429) { aiResponse = retryResp; break; }
          }
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: { message: "Upstream fetch failed: " + (e.message || String(e)), upstreamUrl } }), { status: 502, headers: { 'Content-Type': 'application/json' } });
      }

      if (!aiResponse.ok) {
        return new Response(aiResponse.body, { status: aiResponse.status, headers: aiResponse.headers });
      }

      const contentType = aiResponse.headers.get('content-type') || '';
      const isUpstreamStream = isStream || contentType.includes('text/event-stream');

      if (isUpstreamStream) {
        // --- Tee streaming: passthrough without buffering whole response ---
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const reader = aiResponse.body.getReader();
        const decoder = new TextDecoder();
        let usage = null;
        let contentLen = 0;
        let buffer = "";

        (async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              // Tee to client immediately
              await writer.write(value);
              const text = decoder.decode(value, { stream: true });
              buffer += text;
              // keep buffer bounded to last 8KB for usage extraction
              if (buffer.length > 8192) buffer = buffer.slice(-8192);
              contentLen += (text.match(/"delta"\s*:\s*\{[^}]*"content"/g) || []).length * 4;
              const usageMatch = text.match(/"usage"\s*:\s*\{[^}]+\}/);
              if (usageMatch) {
                try {
                  const u = JSON.parse('{' + usageMatch[0] + '}');
                  usage = u.usage;
                } catch {}
              }
            }
            // Extract final usage if present in trailing chunk
            if (!usage) {
              const m = buffer.match(/"usage"\s*:\s*(\{[^}]+\})/);
              if (m) try { usage = JSON.parse(m[1]); } catch {}
            }
            let cost;
            if (usage) {
              cost = calcCost(usage, requestedModel);
            } else {
              const estCompletionTokens = Math.max(1, Math.ceil(contentLen / 4) || 50);
              const estPromptTokens = Math.max(10, Math.ceil((reqBody.messages ? JSON.stringify(reqBody.messages).length : 100) / 4));
              cost = calcCost({ prompt_tokens: estPromptTokens, completion_tokens: estCompletionTokens, total_tokens: estPromptTokens + estCompletionTokens }, requestedModel);
              const pricing = getPricing(requestedModel);
              cost = Math.max(pricing.minCharge, Math.min(cost, pricing.minCharge * 3));
            }
            cost = cost || getPricing(requestedModel).minCharge;
            const res = await deductBalanceAtomic(env, customerKey, cost);
            // Log for observability
            console.log(`[billing] ${customerKey.slice(0,8)} ${requestedModel} cost=${cost} bal=${res.balance} ok=${res.ok}`);
          } catch (e) {
            console.log("[stream tee error]", e.message);
          } finally {
            try { await writer.close(); } catch {}
          }
        })();

        const headers2 = new Headers();
        headers2.set('Content-Type', 'text/event-stream');
        headers2.set('Cache-Control', 'no-cache');
        headers2.set('Connection', 'keep-alive');
        // Cost headers will be in trailer via event, but set placeholder
        return new Response(readable, { status: 200, headers: headers2 });
      } else {
        const respText = await aiResponse.text();
        let respJson = null;
        try { respJson = JSON.parse(respText); } catch {}
        const usage = respJson?.usage || respJson?.response?.usage || null;
        let cost = calcCost(usage, requestedModel);
        if (cost === null) {
          const estTokens = Math.ceil(respText.length / 4);
          cost = calcCost({ prompt_tokens: 10, completion_tokens: estTokens, total_tokens: 10+estTokens }, requestedModel);
        }
        cost = cost || getPricing(requestedModel).minCharge;
        const deductRes = await deductBalanceAtomic(env, customerKey, cost);
        if (!deductRes.ok) {
          return new Response(JSON.stringify({ error: { message: "Payment Required: Insufficient balance", code: 402 } }), { status: 402, headers: { 'Content-Type': 'application/json' } });
        }
        const headers2 = new Headers(aiResponse.headers);
        headers2.set('X-Trinetra-Cost', String(cost));
        headers2.set('X-Trinetra-Balance', String(deductRes.balance));
        headers2.set('Content-Type', 'application/json');
        let outText = respText;
        if (respJson) {
          respJson._trinetra_cost = cost;
          respJson._trinetra_balance = deductRes.balance;
          outText = JSON.stringify(respJson);
        }
        return new Response(outText, { status: aiResponse.status, headers: headers2 });
      }
    }

    return new Response('Not Found', { status: 404 });
  },

  async scheduled(event, env, ctx) {
    const now = new Date().toISOString();
    try {
      if (env.TRINETRA_DB) {
        await env.TRINETRA_DB.prepare("CREATE TABLE IF NOT EXISTS billing (key TEXT PRIMARY KEY, balance INTEGER)").run();
        // GC: ensure no negative balances
        await env.TRINETRA_DB.prepare("UPDATE billing SET balance = 0 WHERE balance < 0").run();
      }
    } catch(e) {}
    console.log(`[autoscale SLA] tick ${event.cron} at ${now}`);
  }
};
