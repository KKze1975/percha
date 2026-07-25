// One-time setup: obtains a Drive OAuth refresh token delegated to a real
// Google account (needed because service accounts have no storage quota on
// personal, non-Workspace Drive — see PRD section 2 discussion in chat).
// Run once with: node scripts/drive-oauth-setup.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

const ROOT = path.resolve(import.meta.dirname, "..");
const CLIENT_PATH = path.join(ROOT, "credentials", "oauth-client.json");
const ENV_PATH = path.join(ROOT, ".env.local");
const PORT = 8765;
const REDIRECT_URI = `http://localhost:${PORT}`;
const FOLDER_NAME = "Percha - Closet";

const { installed } = JSON.parse(fs.readFileSync(CLIENT_PATH, "utf8"));
const oauth2Client = new google.auth.OAuth2(
  installed.client_id,
  installed.client_secret,
  REDIRECT_URI,
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/drive.file"],
});

console.log("\nAbre esta URL en tu navegador y acepta el consentimiento:\n");
console.log(authUrl);
console.log("\nEsperando el callback en", REDIRECT_URI, "...\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400).end("Falta el parametro code");
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end("<html><body>Listo, puedes cerrar esta pestana.</body></html>");
  server.close();

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const folder = await drive.files.create({
    requestBody: { name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" },
    fields: "id",
  });

  const lines = fs.existsSync(ENV_PATH)
    ? fs.readFileSync(ENV_PATH, "utf8").split("\n").filter(Boolean)
    : [];
  const setVar = (key, value) => {
    const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
    const line = `${key}=${value}`;
    if (idx >= 0) lines[idx] = line;
    else lines.push(line);
  };
  setVar("DRIVE_OAUTH_CLIENT_ID", installed.client_id);
  setVar("DRIVE_OAUTH_CLIENT_SECRET", installed.client_secret);
  setVar("DRIVE_OAUTH_REFRESH_TOKEN", tokens.refresh_token);
  setVar("DRIVE_FOLDER_ID", folder.data.id);
  fs.writeFileSync(ENV_PATH, lines.join("\n") + "\n");

  console.log("Listo. Carpeta 'Percha - Closet' creada en tu Drive.");
  console.log("Guarde DRIVE_OAUTH_* y DRIVE_FOLDER_ID en .env.local (valores no impresos aqui).");
  process.exit(0);
});

server.listen(PORT);
