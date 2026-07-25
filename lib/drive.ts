import { google } from "googleapis";
import { Readable } from "node:stream";

// Service accounts have no Drive storage quota on personal (non-Workspace)
// accounts, so uploads are delegated via OAuth to the real Google account
// that ran scripts/drive-oauth-setup.mjs once.
function getAuth() {
  const clientId = process.env.DRIVE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.DRIVE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.DRIVE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Faltan DRIVE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN — corre scripts/drive-oauth-setup.mjs",
    );
  }
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

export async function uploadToDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  const folderId = process.env.DRIVE_FOLDER_ID;
  if (!folderId) {
    throw new Error("DRIVE_FOLDER_ID no esta configurado");
  }

  const drive = google.drive({ version: "v3", auth: getAuth() });
  const res = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: "id",
  });

  const driveFileId = res.data.id;
  if (!driveFileId) {
    throw new Error("Drive no devolvio un id de archivo");
  }
  return driveFileId;
}

export async function downloadFromDrive(driveFileId: string): Promise<Buffer> {
  const drive = google.drive({ version: "v3", auth: getAuth() });
  const res = await drive.files.get(
    { fileId: driveFileId, alt: "media" },
    { responseType: "arraybuffer" },
  );
  return Buffer.from(res.data as ArrayBuffer);
}
