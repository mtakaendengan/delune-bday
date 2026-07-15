function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('SPREADSHEET_ID belum tersedia. Jalankan setupProject().');
  return SpreadsheetApp.openById(id);
}

function getSheet_(name) {
  var sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Sheet ' + name + ' tidak ditemukan.');
  return sheet;
}

function rowsAsObjects_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values.shift().map(String);
  return values.filter(function(row) { return row.some(String); }).map(function(row) {
    return headers.reduce(function(object, header, index) {
      object[header] = row[index];
      return object;
    }, {});
  });
}

function getPublicConfig_() {
  var rows = rowsAsObjects_(getSheet_('Config'));
  return rows.reduce(function(config, row) {
    if (String(row.Public).toLowerCase() !== 'true') return config;
    config[row.Key] = parseConfigValue_(row.Value, row.Type);
    return config;
  }, {});
}

function getPrivateConfigValue_(key, fallback) {
  var rows = rowsAsObjects_(getSheet_('Config'));
  var row = rows.find(function(item) { return item.Key === key; });
  return row ? parseConfigValue_(row.Value, row.Type) : fallback;
}

function parseConfigValue_(value, type) {
  switch (String(type || 'string').toLowerCase()) {
    case 'number': return Number(value);
    case 'boolean': return String(value).toLowerCase() === 'true';
    case 'json':
      try { return JSON.parse(value); } catch (ignore) { return null; }
    default: return value;
  }
}

function getApprovedWishes_(params) {
  var page = sanitizeInteger_(params.page, 1, 100000, 1);
  var limit = sanitizeInteger_(params.limit, 1, 30, 8);
  var items = rowsAsObjects_(getSheet_('Wishes'))
    .filter(function(row) { return String(row.Status).toUpperCase() === 'APPROVED'; })
    .sort(function(a, b) { return new Date(b.Timestamp) - new Date(a.Timestamp); });

  var total = items.length;
  var totalPages = Math.max(1, Math.ceil(total / limit));
  page = Math.min(page, totalPages);
  var start = (page - 1) * limit;

  return {
    items: items.slice(start, start + limit).map(function(row) {
      return {
        id: row.Id,
        timestamp: row.Timestamp,
        name: row.Name,
        message: row.Message,
        attendance: row.Attendance,
        guestCount: Number(row.GuestCount || 0)
      };
    }),
    pagination: { page: page, limit: limit, total: total, totalPages: totalPages }
  };
}

function getPublishedGallery_() {
  var items = rowsAsObjects_(getSheet_('Gallery'))
    .filter(function(row) { return String(row.Active).toLowerCase() === 'true'; })
    .sort(function(a, b) { return Number(a.SortOrder || 0) - Number(b.SortOrder || 0); })
    .map(function(row) {
      return {
        id: row.Id,
        url: row.Url,
        thumbnailUrl: row.ThumbnailUrl || row.Url,
        caption: row.Caption,
        alt: row.Alt
      };
    });
  return { items: items };
}

function saveWish_(payload) {
  honeypotCheck_(payload);
  var name = sanitizeText_(payload.name, 80, true, 'Nama');
  var message = sanitizeText_(payload.message, 500, true, 'Ucapan');
  var attendance = normalizeAttendance_(payload.attendance, true);
  var guestCount = sanitizeInteger_(payload.guestCount, 0, 10, 1);
  var guestToken = sanitizeText_(payload.guestToken, 120, false, 'Guest token');
  var source = sanitizeText_(payload.source, 120, false, 'Source');
  var identifier = guestToken || name + ':' + source;
  var seconds = Number(PropertiesService.getScriptProperties().getProperty('WISH_RATE_LIMIT_SECONDS') || 45);
  rateLimit_('wish', identifier, seconds);

  var autoApprove = Boolean(getPrivateConfigValue_('autoApproveWishes', false));
  var id = Utilities.getUuid();
  appendRowLocked_('Wishes', [
    id,
    new Date(),
    name,
    message,
    attendance,
    guestCount,
    autoApprove ? 'APPROVED' : 'PENDING',
    guestToken,
    source,
    sanitizeText_(payload.userAgent, 240, false, 'User agent')
  ]);
  logEvent_('INFO', 'wish', 'Ucapan baru tersimpan.', { id: id, status: autoApprove ? 'APPROVED' : 'PENDING' });
  return { ok: true, id: id, message: autoApprove ? 'Ucapan berhasil dipublikasikan.' : 'Ucapan berhasil dikirim dan menunggu moderasi.' };
}

function saveRsvp_(payload) {
  honeypotCheck_(payload);
  var name = sanitizeText_(payload.name, 80, true, 'Nama');
  var attendance = normalizeAttendance_(payload.attendance, false);
  var guestCount = sanitizeInteger_(payload.guestCount, 0, 10, 1);
  var notes = sanitizeText_(payload.notes, 300, false, 'Catatan');
  var guestToken = sanitizeText_(payload.guestToken, 120, false, 'Guest token');
  var source = sanitizeText_(payload.source, 120, false, 'Source');
  var identifier = guestToken || name + ':' + source;
  var seconds = Number(PropertiesService.getScriptProperties().getProperty('RSVP_RATE_LIMIT_SECONDS') || 20);
  rateLimit_('rsvp', identifier, seconds);

  var id = Utilities.getUuid();
  appendRowLocked_('RSVP', [id, new Date(), name, attendance, guestCount, notes, guestToken, source]);
  logEvent_('INFO', 'rsvp', 'RSVP baru tersimpan.', { id: id, attendance: attendance });
  return { ok: true, id: id, message: 'Konfirmasi kehadiran berhasil disimpan.' };
}

function appendRowLocked_(sheetName, values) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    getSheet_(sheetName).appendRow(values);
  } finally {
    lock.releaseLock();
  }
}
