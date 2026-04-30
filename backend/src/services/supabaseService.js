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

// Volltextsuche
async function searchDocuments(userId, query) {
  const { data, error } = await getSupabase()
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .textSearch('ocr_text', query, {
      type: 'websearch',
      config: 'german',
    });

  if (error) throw error;
  return data;
}

// User laden
async function getUser(userId) {
  const { data, error } = await getSupabase().from('users').select('*').eq('id', userId).single();

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

module.exports = {
  supabase,
  upsertUser,
  saveDocument,
  getUserDocuments,
  searchDocuments,
  getUser,
  incrementScanCount,
  updateStorageProvider,
};
