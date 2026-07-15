var SHEET_DEFINITIONS_ = {
  Config: ['Key', 'Value', 'Type', 'Public', 'UpdatedAt'],
  Wishes: ['Id', 'Timestamp', 'Name', 'Message', 'Attendance', 'GuestCount', 'Status', 'GuestToken', 'Source', 'UserAgent'],
  RSVP: ['Id', 'Timestamp', 'Name', 'Attendance', 'GuestCount', 'Notes', 'GuestToken', 'Source'],
  Gallery: ['Id', 'SortOrder', 'FileId', 'Url', 'ThumbnailUrl', 'Caption', 'Alt', 'Active', 'CreatedAt'],
  Uploads: ['Id', 'Timestamp', 'Name', 'Caption', 'FileId', 'Url', 'MimeType', 'Size', 'Status', 'GuestToken'],
  Logs: ['Timestamp', 'Level', 'Action', 'Message', 'Metadata']
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Birthday App')
    .addItem('1. Setup / Perbarui Struktur', 'setupProject')
    .addItem('Buka URL Dashboard', 'showDashboardUrl')
    .addItem('Reset Password Dashboard', 'resetAdminPassword')
    .addSeparator()
    .addItem('Setujui Ucapan pada Baris Aktif', 'approveSelectedWish')
    .addItem('Tolak Ucapan pada Baris Aktif', 'rejectSelectedWish')
    .addItem('Setujui Upload pada Baris Aktif', 'approveSelectedUpload')
    .addItem('Tolak Upload pada Baris Aktif', 'rejectSelectedUpload')
    .addToUi();
}

function setupProject() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Buka Apps Script dari Google Sheet melalui Extensions > Apps Script.');

  var properties = PropertiesService.getScriptProperties();
  properties.setProperty('SPREADSHEET_ID', spreadsheet.getId());

  Object.keys(SHEET_DEFINITIONS_).forEach(function(name) {
    ensureSheet_(spreadsheet, name, SHEET_DEFINITIONS_[name]);
  });

  var rootFolderId = properties.getProperty('MEDIA_FOLDER_ID');
  var rootFolder = rootFolderId ? getFolderSafe_(rootFolderId) : null;
  if (!rootFolder) {
    rootFolder = DriveApp.createFolder('Birthday Invitation Media - ' + spreadsheet.getName());
    properties.setProperty('MEDIA_FOLDER_ID', rootFolder.getId());
  }

  var publishedId = properties.getProperty('PUBLISHED_FOLDER_ID');
  var publishedFolder = publishedId ? getFolderSafe_(publishedId) : null;
  if (!publishedFolder) {
    publishedFolder = rootFolder.createFolder('Published Gallery');
    properties.setProperty('PUBLISHED_FOLDER_ID', publishedFolder.getId());
  }

  var uploadId = properties.getProperty('UPLOAD_FOLDER_ID');
  var uploadFolder = uploadId ? getFolderSafe_(uploadId) : null;
  if (!uploadFolder) {
    uploadFolder = rootFolder.createFolder('Guest Uploads - Pending');
    properties.setProperty('UPLOAD_FOLDER_ID', uploadFolder.getId());
  }

  if (!properties.getProperty('PUBLIC_ACCESS_KEY')) {
    properties.setProperty('PUBLIC_ACCESS_KEY', 'birthday-' + Utilities.getUuid().replace(/-/g, '').slice(0, 20));
  }

  properties.setProperties({
    MAX_UPLOAD_BYTES: String(3 * 1024 * 1024),
    WISH_RATE_LIMIT_SECONDS: '45',
    RSVP_RATE_LIMIT_SECONDS: '20',
    UPLOAD_RATE_LIMIT_SECONDS: '120'
  }, false);

  seedDefaultConfig_(spreadsheet.getSheetByName('Config'));
  styleSheets_(spreadsheet);
  var initialAdminPassword = setupAdminSecurity_();

  var result = {
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    mediaFolderId: rootFolder.getId(),
    mediaFolderUrl: rootFolder.getUrl(),
    publicAccessKey: properties.getProperty('PUBLIC_ACCESS_KEY'),
    dashboardUrl: ScriptApp.getService().getUrl() ? ScriptApp.getService().getUrl() + '?page=dashboard' : ''
  };

  logEvent_('INFO', 'setupProject', 'Setup selesai.', result);
  var passwordMessage = initialAdminPassword
    ? '\n\nPASSWORD ADMIN BARU:\n' + initialAdminPassword + '\nSimpan sekarang; password tidak disimpan dalam bentuk teks.'
    : '\n\nPassword admin sudah pernah dibuat. Gunakan menu Reset Password Dashboard jika lupa.';
  SpreadsheetApp.getUi().alert(
    'Setup selesai',
    'PUBLIC_ACCESS_KEY:\n' + result.publicAccessKey + passwordMessage +
      '\n\nSetelah Web App dideploy, dashboard tersedia pada URL /exec?page=dashboard.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
  return result;
}

function ensureSheet_(spreadsheet, name, headers) {
  var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    var existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
    headers.forEach(function(header, index) {
      if (!existing[index]) sheet.getRange(1, index + 1).setValue(header);
    });
  }
  sheet.setFrozenRows(1);
  return sheet;
}

function seedDefaultConfig_(sheet) {
  var defaults = [
    ['siteTitle', 'Undangan Ulang Tahun Kania', 'string', true],
    ['celebrantName', 'Kania De Lune Takaendengan', 'string', true],
    ['nickname', 'Kania', 'string', true],
    ['age', '0', 'number', true],
    ['eventStart', '2026-07-19T15:00:00+08:00', 'string', true],
    ['eventEnd', '2026-07-19T18:00:00+08:00', 'string', true],
    ['timezone', 'Asia/Makassar', 'string', true],
    ['dateLabel', 'Minggu, 19 Juli 2026', 'string', true],
    ['timeLabel', '15.00 - 18.00 WITA', 'string', true],
    ['venue', 'Rumah Poli', 'string', true],
    ['address', 'Politeknik Indah Blok E-1', 'string', true],
    ['mapUrl', 'https://www.google.com/maps/place/Rumah+Poli/@1.5078659,124.8897013,817m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3287a1dafefa0abb:0xc75a216aa754d8f6!8m2!3d1.5078605!4d124.8922762!16s%2Fg%2F11sf423ls3?entry=ttu&g_ep=EgoyMDI2MDcxMi4wIKXMDSoASAFQAw%3D%3D', 'string', true],
    ['greeting', 'Dengan penuh sukacita, kami mengundang Anda untuk hadir dan merayakan hari istimewa Kania bersama kami.', 'string', true],
    ['storyTitle', 'A little celebration', 'string', true],
    ['storyText', 'Kehadiran dan doa baik Anda akan menjadi hadiah yang sangat berarti bagi Kania dan keluarga.', 'string', true],
    ['dressCode', 'Bebas, rapi, dan ceria', 'string', true],
    ['hostName', 'Keluarga Takaendengan', 'string', true],
    ['closingMessage', 'Sampai bertemu di hari bahagia Kania!', 'string', true],
    ['themePrimary', '#8b5cf6', 'string', true],
    ['themeSecondary', '#ec4899', 'string', true],
    ['themeAccent', '#f59e0b', 'string', true],
    ['heroImage', './assets/images/hero.svg', 'string', true],
    ['portraitImage', './assets/images/portrait.svg', 'string', true],
    ['musicEnabled', 'false', 'boolean', true],
    ['musicUrl', '', 'string', true],
    ['giftEnabled', 'false', 'boolean', true],
    ['giftTitle', 'Birthday Gift', 'string', true],
    ['giftDescription', 'Doa dan kehadiran Anda sudah lebih dari cukup.', 'string', true],
    ['giftBank', '', 'string', true],
    ['giftAccountName', '', 'string', true],
    ['giftAccountNumber', '', 'string', true],
    ['uploadEnabled', 'true', 'boolean', true],
    ['autoApproveWishes', 'false', 'boolean', false]
  ];

  var existing = {};
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().forEach(function(row) {
      existing[String(row[0])] = true;
    });
  }

  var now = new Date();
  var rows = defaults.filter(function(row) { return !existing[row[0]]; }).map(function(row) {
    return [row[0], row[1], row[2], row[3], now];
  });
  if (rows.length) sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
}

function styleSheets_(spreadsheet) {
  Object.keys(SHEET_DEFINITIONS_).forEach(function(name) {
    var sheet = spreadsheet.getSheetByName(name);
    if (!sheet) return;
    var width = SHEET_DEFINITIONS_[name].length;
    sheet.getRange(1, 1, 1, width)
      .setFontWeight('bold')
      .setBackground('#6d28d9')
      .setFontColor('#ffffff');
    sheet.autoResizeColumns(1, width);
    sheet.setRowHeight(1, 32);
  });
}

function getFolderSafe_(id) {
  try { return DriveApp.getFolderById(id); } catch (error) { return null; }
}
