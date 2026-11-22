import { google } from 'googleapis';
import fs from 'fs';

const FOLDER_ID = '1OyzuYwbg6hgB2_gyJKQ0aPphNmcilMgo';
let _drive = null;

async function getDrive() {
  if (_drive) return _drive;
  const creds = JSON.parse(fs.readFileSync('/root/credentials.json', 'utf8'));
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: creds.client_email, private_key: creds.private_key },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  const client = await auth.getClient();
  _drive = google.drive({ version: 'v3', auth: client });
  return _drive;
}

export async function saveResumeToDrive(fileId, jsonData, title) {
  const drive = await getDrive();
  const body = JSON.stringify(jsonData);
  if (fileId) {
    await drive.files.update({ fileId, media: { mimeType: 'application/json', body } });
    return fileId;
  }
  const res = await drive.files.create({
    requestBody: { name: title || 'resume.json', parents: [FOLDER_ID], mimeType: 'application/json' },
    media: { mimeType: 'application/json', body },
    fields: 'id',
  });
  return res.data.id;
}

export async function getResumeFromDrive(fileId) {
  const drive = await getDrive();
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
  return typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
}

export async function deleteResumeFromDrive(fileId) {
  const drive = await getDrive();
  try { await drive.files.delete({ fileId }); } catch {}
}
