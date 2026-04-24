const { google } = require('googleapis');

async function getGmailClient(accessToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth });
}

function collectPdfAttachmentParts(part, acc = []) {
  if (!part) {
    return acc;
  }
  if (Array.isArray(part.parts)) {
    for (const child of part.parts) {
      collectPdfAttachmentParts(child, acc);
    }
    return acc;
  }
  const isPdf =
    part.mimeType === 'application/pdf' ||
    (part.filename && String(part.filename).toLowerCase().endsWith('.pdf'));
  if (isPdf && part.body?.attachmentId) {
    acc.push(part);
  }
  return acc;
}

/**
 * @param {string} accessToken
 * @param {number} [maxResults]
 */
async function getEmailsWithPdfAttachments(accessToken, maxResults = 20) {
  const gmail = await getGmailClient(accessToken);

  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'has:attachment filename:pdf newer_than:30d',
    maxResults,
  });

  const messages = response.data.messages || [];
  const emails = [];

  for (const msg of messages.slice(0, 10)) {
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full',
    });

    const headers = detail.data.payload?.headers || [];
    const from = headers.find((h) => h.name === 'From')?.value || '';
    const subject = headers.find((h) => h.name === 'Subject')?.value || '';
    const date = headers.find((h) => h.name === 'Date')?.value || '';

    const pdfAttachments = collectPdfAttachmentParts(detail.data.payload);

    if (pdfAttachments.length > 0) {
      emails.push({
        id: msg.id,
        from,
        subject,
        date,
        attachments: pdfAttachments.map((p) => ({
          filename: p.filename || 'Anhang.pdf',
          attachmentId: p.body?.attachmentId,
          size: p.body?.size,
        })),
      });
    }
  }

  return emails;
}

/**
 * @param {string} accessToken
 * @param {string} messageId
 * @param {string} attachmentId
 * @returns {Promise<Buffer>}
 */
async function downloadAttachment(accessToken, messageId, attachmentId) {
  const gmail = await getGmailClient(accessToken);

  const response = await gmail.users.messages.attachments.get({
    userId: 'me',
    messageId,
    id: attachmentId,
  });

  const raw = response.data.data;
  if (!raw) {
    throw new Error('Leerer Anhang');
  }

  const buffer = Buffer.from(raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  return buffer;
}

module.exports = { getEmailsWithPdfAttachments, downloadAttachment };
