require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

let _supabase;

function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL und SUPABASE_SERVICE_KEY müssen gesetzt sein.');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

/** Lazy-Client — gleiche API wie zuvor `supabase` Konstante */
const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getSupabase();
      const value = client[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  }
);

// User anlegen oder updaten nach Login
async function upsertUser(userData) {
  const { id, email, name, avatar_url } = userData;

  const { data, error } = await getSupabase()
    .from('users')
    .upsert(
      {
        id,
        email,
        name,
        avatar_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Dokument in DB speichern
async function saveDocument(userId, documentData) {
  const { data, error } = await getSupabase()
    .from('documents')
    .insert({
      user_id: userId,
      filename: documentData.filename,
      original_filename: documentData.originalFilename,
      category: documentData.category,
      subcategory: documentData.subcategory,
      provider: documentData.provider,
      storage_path: documentData.storagePath,
      drive_file_id: documentData.driveFileId,
      drive_web_link: documentData.webViewLink,
      ocr_text: documentData.ocrText,
      document_type: documentData.documentType,
      amount: documentData.amount,
      document_date: documentData.documentDate,
      due_date: documentData.dueDate,
      sender: documentData.sender,
      mime_type: documentData.mimeType,
      size: documentData.size,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Dokumente eines Users laden
async function getUserDocuments(userId) {
  const { data, error } = await getSupabase()
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function getDocument(id, userId) {
  const { data, error } = await getSupabase()
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
}

async function getDocumentsByCategory(userId, category) {
  const { data, error } = await getSupabase()
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function getDocumentsByCategoryAndSubcategory(userId, category, subcategory) {
  const { data, error } = await getSupabase()
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .eq('subcategory', subcategory)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function deleteDocument(id, userId) {
  const { error } = await supabase.from('documents').delete().eq('id', id).eq('user_id', userId);

  if (error) throw error;
}

/** Metazeichen in LIKE-Mustern neutralisieren (`%`, `_`, `\`). */
function escapeLikePattern(raw) {
  return String(raw).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/** Wert für PostgREST-`.or()`-Filter quoten (Kommas u. ä. im Suchbegriff). */
function quotePostgrestFilterValue(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

// Volltextsuche (ocr_text) + ILIKE über mehrere Spalten, Treffer zusammenführen
async function searchDocuments(userId, query) {
  const q = String(query ?? '').trim();
  if (!q) return [];

  const supabase = getSupabase();
  const likePat = `%${escapeLikePattern(q)}%`;
  const quotedPat = quotePostgrestFilterValue(likePat);
  const likeOr = [
    `ocr_text.ilike.${quotedPat}`,
    `filename.ilike.${quotedPat}`,
    `category.ilike.${quotedPat}`,
    `sender.ilike.${quotedPat}`,
    `subcategory.ilike.${quotedPat}`,
  ].join(',');

  const [ftsResult, likeResult] = await Promise.all([
    supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .textSearch('ocr_text', q, {
        type: 'websearch',
        config: 'german',
      }),
    supabase.from('documents').select('*').eq('user_id', userId).or(likeOr),
  ]);

  if (ftsResult.error) throw ftsResult.error;
  if (likeResult.error) throw likeResult.error;

  const ftsRows = ftsResult.data || [];
  const likeRows = likeResult.data || [];
  const ftsIds = new Set(ftsRows.map((r) => r.id));

  const merged = [...ftsRows];
  for (const row of likeRows) {
    if (!ftsIds.has(row.id)) merged.push(row);
  }
  return merged;
}

// User laden (inkl. Drive-Tokens für serverseitiges Refresh)
async function getUser(userId) {
  const { data, error } = await getSupabase()
    .from('users')
    .select('id, email, name, avatar_url, storage_provider, drive_access_token, drive_refresh_token, updated_at')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data;
}

// Scan Counter erhöhen
async function incrementScanCount(userId) {
  const { data, error } = await getSupabase().rpc('increment_scan_count', { user_id: userId });

  if (error) throw error;
  return data;
}

async function updateStorageProvider(userId, provider) {
  const { error } = await getSupabase()
    .from('users')
    .update({ storage_provider: provider, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

async function updateDriveTokens(userId, tokens) {
  const updates = {
    drive_access_token: tokens?.access_token ?? null,
    updated_at: new Date().toISOString(),
  };
  const rt = tokens?.refresh_token;
  if (rt != null && String(rt).trim() !== '') {
    updates.drive_refresh_token = String(rt).trim();
  }

  const { error } = await getSupabase().from('users').update(updates).eq('id', userId);
  if (error) throw error;
}

module.exports = {
  supabase,
  upsertUser,
  saveDocument,
  getDocument,
  deleteDocument,
  getDocumentsByCategory,
  getDocumentsByCategoryAndSubcategory,
  getUserDocuments,
  searchDocuments,
  getUser,
  incrementScanCount,
  updateStorageProvider,
  updateDriveTokens,
};
