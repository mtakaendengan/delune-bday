var ADMIN_SESSION_SECONDS_ = 4 * 60 * 60;

function setupAdminSecurity_() {
  var properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('ADMIN_TOKEN_SECRET')) {
    properties.setProperty('ADMIN_TOKEN_SECRET', Utilities.getUuid() + Utilities.getUuid());
  }
  if (!properties.getProperty('ADMIN_SESSION_VERSION')) {
    properties.setProperty('ADMIN_SESSION_VERSION', Utilities.getUuid());
  }
  if (!properties.getProperty('ADMIN_PASSWORD_HASH')) {
    var password = generateAdminPassword_();
    setAdminPassword_(password);
    return password;
  }
  return '';
}

function generateAdminPassword_() {
  return 'Kania-' + Utilities.getUuid().replace(/-/g, '').slice(0, 10);
}

function setAdminPassword_(password) {
  var text = String(password || '');
  if (text.length < 8) throw new Error('Password admin minimal 8 karakter.');
  var properties = PropertiesService.getScriptProperties();
  var salt = Utilities.getUuid();
  properties.setProperties({
    ADMIN_PASSWORD_SALT: salt,
    ADMIN_PASSWORD_HASH: hashAdminPassword_(salt, text),
    ADMIN_SESSION_VERSION: Utilities.getUuid()
  }, false);
}

function resetAdminPassword() {
  var password = generateAdminPassword_();
  setAdminPassword_(password);
  SpreadsheetApp.getUi().alert(
    'Password admin baru',
    password + '\n\nSimpan password ini. Password lama dan seluruh sesi dashboard sebelumnya sudah tidak berlaku.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
  return password;
}

function showDashboardUrl() {
  var serviceUrl = ScriptApp.getService().getUrl();
  var message = serviceUrl
    ? serviceUrl + '?page=dashboard'
    : 'Web App belum dideploy. Pilih Deploy > New deployment > Web app terlebih dahulu.';
  SpreadsheetApp.getUi().alert('URL Dashboard', message, SpreadsheetApp.getUi().ButtonSet.OK);
  return message;
}

function hashAdminPassword_(salt, password) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(salt) + ':' + String(password),
    Utilities.Charset.UTF_8
  );
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, '');
}

function verifyAdminPassword_(password) {
  var properties = PropertiesService.getScriptProperties();
  var salt = properties.getProperty('ADMIN_PASSWORD_SALT') || '';
  var expected = properties.getProperty('ADMIN_PASSWORD_HASH') || '';
  var actual = hashAdminPassword_(salt, String(password || ''));
  return constantTimeEqual_(expected, actual);
}

function constantTimeEqual_(left, right) {
  left = String(left || '');
  right = String(right || '');
  var mismatch = left.length ^ right.length;
  var length = Math.max(left.length, right.length);
  for (var index = 0; index < length; index += 1) {
    mismatch |= (left.charCodeAt(index % Math.max(1, left.length)) || 0) ^
      (right.charCodeAt(index % Math.max(1, right.length)) || 0);
  }
  return mismatch === 0;
}

function createAdminToken_() {
  var properties = PropertiesService.getScriptProperties();
  var payload = {
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS_,
    version: properties.getProperty('ADMIN_SESSION_VERSION'),
    nonce: Utilities.getUuid()
  };
  var encoded = Utilities.base64EncodeWebSafe(JSON.stringify(payload), Utilities.Charset.UTF_8).replace(/=+$/g, '');
  var signature = signAdminToken_(encoded);
  return encoded + '.' + signature;
}

function signAdminToken_(encodedPayload) {
  var secret = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN_SECRET');
  if (!secret) throw new Error('Keamanan dashboard belum disiapkan. Jalankan setupProject().');
  var bytes = Utilities.computeHmacSha256Signature(encodedPayload, secret, Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, '');
}

function assertAdminToken_(token) {
  var parts = String(token || '').split('.');
  if (parts.length !== 2 || !constantTimeEqual_(signAdminToken_(parts[0]), parts[1])) {
    throw new Error('Sesi dashboard tidak valid. Silakan masuk kembali.');
  }
  var payload;
  try {
    payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
  } catch (error) {
    throw new Error('Sesi dashboard rusak. Silakan masuk kembali.');
  }
  var properties = PropertiesService.getScriptProperties();
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Sesi dashboard telah berakhir.');
  if (payload.version !== properties.getProperty('ADMIN_SESSION_VERSION')) throw new Error('Sesi dashboard sudah tidak berlaku.');
  return payload;
}

function adminLogin(password) {
  setupAdminSecurity_();
  var cache = CacheService.getScriptCache();
  var attemptKey = 'admin-login:' + hashAdminPassword_('attempt', String(password || '')).slice(0, 20);
  var attempts = Number(cache.get(attemptKey) || 0);
  if (attempts >= 5) throw new Error('Terlalu banyak percobaan login. Coba kembali beberapa menit lagi.');
  if (!verifyAdminPassword_(password)) {
    cache.put(attemptKey, String(attempts + 1), 300);
    logEvent_('WARN', 'adminLogin', 'Login dashboard gagal.', {});
    throw new Error('Password admin salah.');
  }
  cache.remove(attemptKey);
  logEvent_('INFO', 'adminLogin', 'Login dashboard berhasil.', {});
  return { token: createAdminToken_(), expiresIn: ADMIN_SESSION_SECONDS_ };
}

function adminGetDashboard(token) {
  assertAdminToken_(token);
  var wishes = rowsAsObjects_(getSheet_('Wishes'));
  var rsvp = rowsAsObjects_(getSheet_('RSVP'));
  var uploads = rowsAsObjects_(getSheet_('Uploads'));
  var gallery = rowsAsObjects_(getSheet_('Gallery'));
  return {
    config: rowsAsObjects_(getSheet_('Config')).map(function(row) {
      return {
        key: String(row.Key || ''),
        value: serializeConfigValue_(row.Value),
        type: String(row.Type || 'string'),
        public: String(row.Public).toLowerCase() === 'true',
        updatedAt: serializeDate_(row.UpdatedAt)
      };
    }),
    stats: {
      wishesTotal: wishes.length,
      wishesPending: wishes.filter(function(row) { return String(row.Status).toUpperCase() === 'PENDING'; }).length,
      rsvpTotal: rsvp.length,
      attending: rsvp.filter(function(row) { return String(row.Attendance) === 'Hadir'; }).length,
      galleryActive: gallery.filter(function(row) { return String(row.Active).toLowerCase() === 'true'; }).length,
      uploadsPending: uploads.filter(function(row) { return String(row.Status).toUpperCase() === 'PENDING'; }).length
    },
    wishes: wishes.slice().sort(sortNewest_).slice(0, 40).map(function(row) {
      return {
        id: String(row.Id || ''), timestamp: serializeDate_(row.Timestamp), name: String(row.Name || ''),
        message: String(row.Message || ''), attendance: String(row.Attendance || ''), status: String(row.Status || '')
      };
    }),
    uploads: uploads.slice().sort(sortNewest_).slice(0, 30).map(function(row) {
      return {
        id: String(row.Id || ''), timestamp: serializeDate_(row.Timestamp), name: String(row.Name || ''),
        caption: String(row.Caption || ''), url: String(row.Url || ''), status: String(row.Status || '')
      };
    })
  };
}

function serializeConfigValue_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
  }
  return value == null ? '' : String(value);
}

function serializeDate_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) return value.toISOString();
  return value == null ? '' : String(value);
}

function sortNewest_(a, b) {
  return new Date(b.Timestamp || 0).getTime() - new Date(a.Timestamp || 0).getTime();
}

function adminSaveConfig(token, items) {
  assertAdminToken_(token);
  if (!Array.isArray(items) || items.length > 100) throw new Error('Data konfigurasi tidak valid.');
  var sheet = getSheet_('Config');
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(String);
  var keyColumn = headers.indexOf('Key');
  var valueColumn = headers.indexOf('Value');
  var typeColumn = headers.indexOf('Type');
  var publicColumn = headers.indexOf('Public');
  var updatedColumn = headers.indexOf('UpdatedAt');
  var rowByKey = {};
  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) rowByKey[String(values[rowIndex][keyColumn])] = rowIndex + 1;

  var allowedTypes = ['string', 'number', 'boolean', 'json'];
  var now = new Date();
  items.forEach(function(item) {
    var key = sanitizeText_(item.key, 80, true, 'Key');
    if (!rowByKey[key]) throw new Error('Key konfigurasi tidak dikenal: ' + key);
    var value = String(item.value == null ? '' : item.value).slice(0, 4000);
    var type = String(item.type || 'string').toLowerCase();
    if (allowedTypes.indexOf(type) === -1) type = 'string';
    var row = rowByKey[key];
    sheet.getRange(row, valueColumn + 1).setValue(value);
    sheet.getRange(row, typeColumn + 1).setValue(type);
    sheet.getRange(row, publicColumn + 1).setValue(Boolean(item.public));
    if (updatedColumn >= 0) sheet.getRange(row, updatedColumn + 1).setValue(now);
  });
  logEvent_('INFO', 'adminSaveConfig', 'Konfigurasi diperbarui dari dashboard.', { count: items.length });
  return { ok: true, message: 'Konfigurasi berhasil disimpan.' };
}

function adminModerateWish(token, id, status) {
  assertAdminToken_(token);
  status = String(status || '').toUpperCase();
  if (['APPROVED', 'REJECTED', 'PENDING'].indexOf(status) === -1) throw new Error('Status ucapan tidak valid.');
  updateStatusById_('Wishes', id, status);
  return { ok: true };
}

function adminModerateUpload(token, id, status) {
  assertAdminToken_(token);
  status = String(status || '').toUpperCase();
  if (status === 'APPROVED') approveUploadById_(id);
  else if (status === 'REJECTED' || status === 'PENDING') updateStatusById_('Uploads', id, status);
  else throw new Error('Status upload tidak valid.');
  return { ok: true };
}

function updateStatusById_(sheetName, id, status) {
  var sheet = getSheet_(sheetName);
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(String);
  var idColumn = headers.indexOf('Id');
  var statusColumn = headers.indexOf('Status');
  if (idColumn < 0 || statusColumn < 0) throw new Error('Kolom Id/Status tidak ditemukan.');
  for (var row = 1; row < values.length; row += 1) {
    if (String(values[row][idColumn]) === String(id)) {
      sheet.getRange(row + 1, statusColumn + 1).setValue(status);
      logEvent_('INFO', 'moderation', sheetName + ' diperbarui.', { id: id, status: status });
      return;
    }
  }
  throw new Error('Data tidak ditemukan.');
}
