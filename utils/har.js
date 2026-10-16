import fs from 'node:fs';

const SECRET_HEADERS = /^(authorization|cookie|set-cookie|x-api-key|x-auth-token|proxy-authorization)$/i;
const SECRET_FIELDS = /"(token|accessToken|access_token|refreshToken|refresh_token|password|otp)"\s*:\s*"[^"]*"/g;

// Redacts credentials from a HAR so a recording can be reviewed and committed.
export function sanitizeHar(file) {
  const har = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const entry of har.log?.entries ?? []) {
    for (const part of [entry.request, entry.response]) {
      if (!part) continue;
      part.headers = (part.headers ?? []).filter((h) => !SECRET_HEADERS.test(h.name));
      part.cookies = [];
    }
    if (entry.request?.postData?.text) {
      entry.request.postData.text = entry.request.postData.text.replace(SECRET_FIELDS, '"$1":"[redacted]"');
    }
    const content = entry.response?.content;
    if (content?.text && content.encoding !== 'base64') {
      content.text = content.text.replace(SECRET_FIELDS, '"$1":"[redacted]"');
    }
  }
  fs.writeFileSync(file, JSON.stringify(har, null, 2));
}
