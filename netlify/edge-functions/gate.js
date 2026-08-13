// netlify/edge-functions/gate.js
//
// Protects the entire site with a single shared password.
// The password and session secret live ONLY in Netlify's environment
// variables (Site configuration > Environment variables) — never in
// your GitHub repo, never sent to the browser.

const COOKIE_NAME = "site_auth";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export default async (request, context) => {
  const url = new URL(request.url);
  const expected = await sign(Netlify.env.get("SESSION_SECRET") || "");

  // Handle the login form submission
  if (url.pathname === "/login" && request.method === "POST") {
    const form = await request.formData();
    const entered = (form.get("password") || "").toString();
    const correct = entered === (Netlify.env.get("SITE_PASSWORD") || "");

    if (correct) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: "/",
          "Set-Cookie": `${COOKIE_NAME}=${expected}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`,
        },
      });
    }
    return new Response(loginPage("Incorrect password. Try again."), {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Show the login page itself
  if (url.pathname === "/login" && request.method === "GET") {
    return new Response(loginPage(), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Check for a valid session cookie
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (match && match[1] === expected) {
    return context.next(); // let the real page through
  }

  // No valid session -> block and show login page
  return new Response(loginPage(), {
    status: 401,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};

async function sign(secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("authenticated"));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function loginPage(error = "") {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Private — Enter Password</title>
<style>
  body { margin:0; min-height:100vh; display:grid; place-items:center; font-family: Inter, sans-serif; background:#f7f8fc; }
  form { background:#fff; padding:36px 32px; border-radius:16px; box-shadow:0 20px 50px rgba(40,50,90,.12); width:280px; }
  h1 { font-size:16px; margin:0 0 18px; color:#11162a; }
  input { width:100%; padding:10px 12px; border:1px solid #dcdfea; border-radius:8px; font-size:14px; box-sizing:border-box; }
  button { width:100%; margin-top:14px; padding:10px; border:0; border-radius:8px; background:#5368e9; color:#fff; font-weight:600; cursor:pointer; }
  .err { color:#c0392b; font-size:12px; margin-top:10px; }
</style>
</head>
<body>
  <form method="POST" action="/login">
    <h1>This page is private</h1>
    <input type="password" name="password" placeholder="Password" autofocus required />
    <button type="submit">Enter</button>
    ${error ? `<div class="err">${error}</div>` : ""}
  </form>
</body>
</html>`;
}

export const config = { path: "/*" };
