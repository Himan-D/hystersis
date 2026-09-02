/**
 * Hystersis Auth — OIDC Provider for auth.hystersis.com
 * Minimal PKCE Authorization Code flow with loopback support for hystersis CLI
 * Branded hystersis.com only, no x.ai refs
 */
const ISSUER = "https://auth.hystersis.com";
const CLIENT_ID = "b1a00492-073a-47ea-816f-4c329264a828";

// In-memory code store via KV would be better, but Memory + KV fallback for Workers
// For single-instance demo we use a Map + KV if available
const codes = new Map();

function json(data, status=200, extra={}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", ...extra }
  });
}
function html(body, status=200) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" }});
}

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function sha256(s) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return b64url(h);
}

// Very simple JWT - HS256 with env.AUTH_SECRET or fallback (not for prod, use real keys)
async function signJWT(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = (o) => b64url(new TextEncoder().encode(JSON.stringify(o)));
  const h = enc(header), p = enc(payload);
  const data = `${h}.${p}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${b64url(sig)}`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = request.headers.get("host") || url.hostname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: {
        "Access-Control-Allow-Origin":"*",
        "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
        "Access-Control-Allow-Headers":"Content-Type, Authorization"
      }});
    }

    // Discovery - this is what CLI calls first and was NXDOMAIN before
    if (url.pathname === "/.well-known/openid-configuration") {
      return json({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/authorize`,
        token_endpoint: `${ISSUER}/token`,
        userinfo_endpoint: `${ISSUER}/userinfo`,
        jwks_uri: `${ISSUER}/jwks`,
        response_types_supported: ["code"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["HS256","RS256"],
        scopes_supported: ["openid","profile","email","offline_access","api:access","grok-cli:access","conversations:read","conversations:write","workspaces:read","workspaces:write"],
        token_endpoint_auth_methods_supported: ["none"],
        claims_supported: ["sub","email","name","preferred_username"],
        code_challenge_methods_supported: ["S256","plain"]
      });
    }

    if (url.pathname === "/jwks") {
      return json({ keys: [] });
    }

    // Authorization endpoint - PKCE flow used by `hystersis login`
    // GET /authorize?response_type=code&client_id=...&redirect_uri=http://localhost:XXXX/callback&code_challenge=...&state=...
    if (url.pathname === "/authorize" && request.method === "GET") {
      const clientId = url.searchParams.get("client_id");
      const redirectUri = url.searchParams.get("redirect_uri") || "";
      const state = url.searchParams.get("state") || "";
      const codeChallenge = url.searchParams.get("code_challenge") || "";
      const codeChallengeMethod = url.searchParams.get("code_challenge_method") || "plain";
      const scope = url.searchParams.get("scope") || "openid profile email";

      if (clientId !== CLIENT_ID) {
        return html(`<h1>Invalid client_id</h1><p>Expected ${CLIENT_ID}</p>`, 400);
      }

      // Show branded consent page that auto-approves for loopback (CLI) - in production replace with real login (GitHub/Google/Email OTP)
      const code = crypto.randomUUID().replace(/-/g,"").slice(0,32);
      const authId = crypto.randomUUID();

      // Store for token exchange - include PKCE challenge
      const record = { clientId, redirectUri, state, codeChallenge, codeChallengeMethod, scope, createdAt: Date.now() };
      codes.set(code, record);
      // Also try KV if available
      if (env.HYSTERSIS_AUTH_KV) {
        try { await env.HYSTERSIS_AUTH_KV.put(`code:${code}`, JSON.stringify(record), { expirationTtl: 600 }); } catch {}
      }

      // If redirect is loopback (CLI), auto-redirect immediately to avoid extra click - but show UI for 500ms for branding
      const isLoopback = redirectUri.includes("localhost") || redirectUri.includes("127.0.0.1");
      const redirectUrl = `${redirectUri}${redirectUri.includes("?") ? "&" : "?"}code=${code}&state=${encodeURIComponent(state)}`;

      return html(`<!doctype html>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hystersis — Authorize</title>
<style>
  *{font-family:ui-sans-serif,system-ui,-apple-system,sans-serif}
  body{max-width:520px;margin:60px auto;padding:24px;color:#111}
  .card{border:1px solid #e5e7eb;border-radius:16px;padding:24px;box-shadow:0 4px 24px rgba(0,0,0,.06)}
  .logo{font-weight:800;font-size:22px;letter-spacing:-.04em}
  .logo span{color:#6b7280;font-weight:600}
  .btn{display:inline-flex;align-items:center;justify-content:center;width:100%;padding:12px 16px;border-radius:10px;background:#111;color:#fff;text-decoration:none;font-weight:600;margin-top:16px}
  .muted{color:#6b7280;font-size:13px;margin-top:12px}
  code{background:#f3f4f6;padding:2px 6px;border-radius:6px;font-size:12px}
</style>
<div class="card">
  <div class="logo">hystersis<span>.com</span></div>
  <h2 style="margin:12px 0 8px">Authorize Hystersis CLI</h2>
  <p class="muted">CLI is requesting <code>${scope.replace(/</g,"&lt;")}</code> for loopback <code>${redirectUri.replace(/</g,"&lt;")}</code></p>
  <a class="btn" href="${redirectUrl}">Continue → ${isLoopback ? "localhost" : "App"}</a>
  <p class="muted">You will be redirected to <code>${redirectUri.slice(0,60)}</code>. Auto-redirect in 1s…</p>
  <p class="muted" style="font-size:11px">Issued by ${ISSUER} • No x.ai branding</p>
</div>
<script>setTimeout(()=>location.href="${redirectUrl}", ${isLoopback ? 400 : 1200});</script>`, 200);
    }

    // Token endpoint - POST /token (authorization_code or refresh_token)
    if (url.pathname === "/token" && request.method === "POST") {
      const ct = request.headers.get("content-type") || "";
      let body = {};
      if (ct.includes("application/json")) body = await request.json().catch(()=>({}));
      else {
        const form = await request.formData();
        for (const [k,v] of form.entries()) body[k]=v;
        if (!Object.keys(body).length) {
          const txt = await request.text().catch(()=> "");
          if (txt) {
            for (const kv of txt.split("&")) { const [k,v]=kv.split("="); if(k) body[decodeURIComponent(k)]=decodeURIComponent(v||""); }
          }
        }
      }
      // Also support raw text fallback
      if (!body.code) {
        try {
          const raw = await request.clone().text();
          for (const kv of raw.split("&")) { const [k,v]=kv.split("="); if(k && !body[k]) body[decodeURIComponent(k)]=decodeURIComponent(v||""); }
        } catch {}
      }

      // Handle refresh_token grant first (CLI proactive refresh uses this)
      if (body.grant_type === "refresh_token") {
        const rt = body.refresh_token || "";
        if (!rt) return json({ error:"invalid_request", error_description:"missing refresh_token" }, 400);
        // For demo we accept any hyst_ refresh token and rotate; in prod verify via KV/DB
        const now2 = Math.floor(Date.now()/1000);
        const sub2 = "hystersis-user-refreshed";
        const email2 = `user-${sub2}@hystersis.com`;
        const secret2 = env.AUTH_SECRET || "hystersis-dev-secret-change-in-prod";
        const newAccess = await signJWT({ iss: ISSUER, sub: sub2, aud: CLIENT_ID, exp: now2+3600, iat: now2, email: email2, name:"Hystersis User" }, secret2);
        const newRefresh = `hyst_${crypto.randomUUID().replace(/-/g,"")}_${Date.now()}`;
        const newId = await signJWT({ iss: ISSUER, sub: sub2, aud: CLIENT_ID, exp: now2+3600, iat: now2, email: email2, name:"Hystersis User", preferred_username: email2 }, secret2);
        return json({ access_token: newAccess, token_type:"Bearer", expires_in:3600, refresh_token: newRefresh, id_token: newId, scope:"openid profile email offline_access" });
      }

      const code = body.code || url.searchParams.get("code");
      const verifier = body.code_verifier || "";
      const clientId = body.client_id || CLIENT_ID;

      if (!code) return json({ error:"invalid_request", error_description:"missing code" }, 400);

      let rec = codes.get(code);
      if (!rec && env.HYSTERSIS_AUTH_KV) {
        try { const v = await env.HYSTERSIS_AUTH_KV.get(`code:${code}`); if(v) rec = JSON.parse(v); } catch {}
      }
      if (!rec) return json({ error:"invalid_grant", error_description:"code not found or expired" }, 400);

      // PKCE verify
      if (rec.codeChallenge) {
        let expected = rec.codeChallenge;
        let actual = verifier;
        if (rec.codeChallengeMethod === "S256") actual = await sha256(verifier);
        if (actual !== expected) return json({ error:"invalid_grant", error_description:"PKCE mismatch" }, 400);
      }

      // One-time use
      codes.delete(code);
      if (env.HYSTERSIS_AUTH_KV) try { await env.HYSTERSIS_AUTH_KV.delete(`code:${code}`); } catch {}

      const now = Math.floor(Date.now()/1000);
      const sub = "hystersis-user-" + crypto.randomUUID().slice(0,8);
      const email = `user-${sub}@hystersis.com`;
      const secret = env.AUTH_SECRET || "hystersis-dev-secret-change-in-prod";
      const accessToken = await signJWT({ iss: ISSUER, sub, aud: CLIENT_ID, exp: now+3600, iat: now, email, name:"Hystersis User", scope: rec.scope }, secret);
      const refreshToken = `hyst_${crypto.randomUUID().replace(/-/g,"")}_${Date.now()}`;
      const idToken = await signJWT({ iss: ISSUER, sub, aud: CLIENT_ID, exp: now+3600, iat: now, email, name:"Hystersis User", preferred_username: email }, secret);

      // Store refresh mapping if KV
      if (env.HYSTERSIS_AUTH_KV) try { await env.HYSTERSIS_AUTH_KV.put(`rt:${refreshToken}`, JSON.stringify({ sub, email }), { expirationTtl: 60*60*24*30 }); } catch {}

      return json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: refreshToken,
        id_token: idToken,
        scope: rec.scope
      });
    }

    // Refresh grant
    if (url.pathname === "/token" && request.method === "POST") { /* handled above */ }

    // Handle refresh_token grant when code path not matched - second check
    // (unreachable due to above, but keep for clarity)

    if (url.pathname === "/userinfo" && request.method === "GET") {
      const auth = request.headers.get("Authorization") || "";
      // Just return a stub user - real impl would verify JWT
      return json({ sub:"hystersis-user", email:"user@hystersis.com", name:"Hystersis User", preferred_username:"user@hystersis.com", email_verified:true });
    }

    // Health / branding
    if (url.pathname === "/health" || url.pathname === "/") {
      return json({ ok:true, issuer: ISSUER, branded:"hystersis.com", discovery: `${ISSUER}/.well-known/openid-configuration` });
    }

    // Also support refresh_token grant via same /token - detect grant_type
    // (already handled, but if request was JSON with grant_type=refresh_token)
    // For any other path, 404 with branded message
    return json({ error:"not_found", branded:"hystersis.com", hint:`${ISSUER}/.well-known/openid-configuration` }, 404);
  }
};
