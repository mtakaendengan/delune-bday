function assertPublicAccess_(providedKey) {
  var expected = PropertiesService.getScriptProperties().getProperty('PUBLIC_ACCESS_KEY');
  if (!expected) throw new Error('Backend belum disetup. Jalankan setupProject().');
  if (String(providedKey || '') !== expected) throw new Error('Access key tidak valid.');
}

function sanitizeText_(value, maxLength, required, fieldName) {
  var text = String(value == null ? '' : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
  if (required && !text) throw new Error((fieldName || 'Field') + ' wajib diisi.');
  if (text.length > maxLength) throw new Error((fieldName || 'Field') + ' melebihi ' + maxLength + ' karakter.');
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

function sanitizeInteger_(value, min, max, fallback) {
  var number = parseInt(value, 10);
  if (!isFinite(number)) number = fallback;
  return Math.min(max, Math.max(min, number));
}

function normalizeAttendance_(value, allowEmpty) {
  var attendance = String(value || '').trim();
  var allowed = ['', 'Hadir', 'Tidak Hadir', 'Masih Ragu'];
  if (allowed.indexOf(attendance) === -1) throw new Error('Nilai kehadiran tidak valid.');
  if (!allowEmpty && !attendance) throw new Error('Konfirmasi kehadiran wajib dipilih.');
  return attendance;
}

function rateLimit_(action, identifier, seconds) {
  var cache = CacheService.getScriptCache();
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(identifier || 'anonymous'),
    Utilities.Charset.UTF_8
  );
  var hash = Utilities.base64EncodeWebSafe(digest).slice(0, 30);
  var key = 'rate:' + action + ':' + hash;
  if (cache.get(key)) throw new Error('Terlalu banyak permintaan. Coba kembali beberapa saat lagi.');
  cache.put(key, '1', seconds);
}

function honeypotCheck_(payload) {
  if (payload.website || payload.company || payload.phone_confirm) throw new Error('Permintaan ditolak.');
}
