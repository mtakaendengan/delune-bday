function saveGuestUpload_(payload) {
  honeypotCheck_(payload);
  var properties = PropertiesService.getScriptProperties();
  var maxBytes = Number(properties.getProperty('MAX_UPLOAD_BYTES') || (3 * 1024 * 1024));
  var name = sanitizeText_(payload.name, 80, true, 'Nama');
  var caption = sanitizeText_(payload.caption, 160, false, 'Caption');
  var filename = sanitizeText_(payload.filename, 120, true, 'Nama file');
  var mimeType = String(payload.mimeType || '');
  var declaredSize = Number(payload.size || 0);
  var guestToken = sanitizeText_(payload.guestToken, 120, false, 'Guest token');
  var allowed = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowed.indexOf(mimeType) === -1) throw new Error('Format file tidak diizinkan.');
  if (!payload.base64) throw new Error('Data foto tidak ditemukan.');
  if (declaredSize < 1 || declaredSize > maxBytes) throw new Error('Ukuran foto tidak valid atau melebihi batas.');

  var seconds = Number(properties.getProperty('UPLOAD_RATE_LIMIT_SECONDS') || 120);
  rateLimit_('upload', guestToken || name, seconds);

  var bytes;
  try {
    bytes = Utilities.base64Decode(String(payload.base64));
  } catch (error) {
    throw new Error('Data foto tidak valid.');
  }
  if (bytes.length > maxBytes) throw new Error('Ukuran foto melebihi batas.');

  var folderId = properties.getProperty('UPLOAD_FOLDER_ID');
  if (!folderId) throw new Error('Folder upload belum disiapkan. Jalankan setupProject().');
  var safeFilename = new Date().getTime() + '-' + filename.replace(/[^0-9A-Za-z._-]/g, '_');
  var blob = Utilities.newBlob(bytes, mimeType, safeFilename);
  var file = DriveApp.getFolderById(folderId).createFile(blob);
  var id = Utilities.getUuid();
  var internalUrl = file.getUrl();

  appendRowLocked_('Uploads', [
    id,
    new Date(),
    name,
    caption,
    file.getId(),
    internalUrl,
    mimeType,
    bytes.length,
    'PENDING',
    guestToken
  ]);
  logEvent_('INFO', 'upload', 'Upload tamu tersimpan.', { id: id, fileId: file.getId(), size: bytes.length });
  return { ok: true, id: id, message: 'Foto berhasil diunggah dan menunggu moderasi.' };
}

function approveSelectedWish() {
  updateSelectedStatus_('Wishes', 'APPROVED');
}

function rejectSelectedWish() {
  updateSelectedStatus_('Wishes', 'REJECTED');
}

function rejectSelectedUpload() {
  updateSelectedStatus_('Uploads', 'REJECTED');
}

function updateSelectedStatus_(sheetName, status) {
  var sheet = SpreadsheetApp.getActiveSheet();
  if (!sheet || sheet.getName() !== sheetName) throw new Error('Buka sheet ' + sheetName + ' dan pilih satu baris data.');
  var row = sheet.getActiveRange().getRow();
  if (row < 2) throw new Error('Pilih baris data, bukan header.');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var statusColumn = headers.indexOf('Status') + 1;
  if (!statusColumn) throw new Error('Kolom Status tidak ditemukan.');
  sheet.getRange(row, statusColumn).setValue(status);
  SpreadsheetApp.getUi().alert('Status diperbarui menjadi ' + status + '.');
}

function approveSelectedUpload() {
  var sheet = SpreadsheetApp.getActiveSheet();
  if (!sheet || sheet.getName() !== 'Uploads') throw new Error('Buka sheet Uploads dan pilih satu baris data.');
  var rowNumber = sheet.getActiveRange().getRow();
  if (rowNumber < 2) throw new Error('Pilih baris upload, bukan header.');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var idColumn = headers.indexOf('Id') + 1;
  if (!idColumn) throw new Error('Kolom Id tidak ditemukan.');
  approveUploadById_(sheet.getRange(rowNumber, idColumn).getDisplayValue());
  SpreadsheetApp.getUi().alert('Foto disetujui dan ditambahkan ke Gallery.');
}

function approveUploadById_(id) {
  var sheet = getSheet_('Uploads');
  var values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) throw new Error('Data upload tidak ditemukan.');
  var headers = values[0];
  var idColumn = headers.indexOf('Id');
  if (idColumn < 0) throw new Error('Kolom Id tidak ditemukan.');
  for (var row = 1; row < values.length; row += 1) {
    if (String(values[row][idColumn]) === String(id)) {
      approveUploadRow_(sheet, row + 1, headers, values[row]);
      return;
    }
  }
  throw new Error('Upload tidak ditemukan.');
}

function approveUploadRow_(sheet, rowNumber, headers, values) {
  var record = headers.reduce(function(object, header, index) {
    object[header] = values[index];
    return object;
  }, {});
  if (!record.FileId) throw new Error('FileId tidak ditemukan.');

  var file = DriveApp.getFileById(record.FileId);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (error) {
    throw new Error('File tidak dapat dibuat publik. Periksa kebijakan Google Workspace: ' + error.message);
  }

  var publishedFolderId = PropertiesService.getScriptProperties().getProperty('PUBLISHED_FOLDER_ID');
  if (publishedFolderId) file.moveTo(DriveApp.getFolderById(publishedFolderId));

  var directUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();
  var thumbnailUrl = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1200';
  var gallery = getSheet_('Gallery');
  var galleryRows = rowsAsObjects_(gallery);
  var alreadyPublished = galleryRows.some(function(item) { return String(item.FileId) === String(file.getId()); });
  if (!alreadyPublished) {
    var sortOrder = Math.max(0, gallery.getLastRow() - 1) + 1;
    gallery.appendRow([
      Utilities.getUuid(),
      sortOrder,
      file.getId(),
      directUrl,
      thumbnailUrl,
      record.Caption || '',
      record.Caption || ('Foto dari ' + record.Name),
      true,
      new Date()
    ]);
  }

  var statusColumn = headers.indexOf('Status') + 1;
  var urlColumn = headers.indexOf('Url') + 1;
  if (statusColumn) sheet.getRange(rowNumber, statusColumn).setValue('APPROVED');
  if (urlColumn) sheet.getRange(rowNumber, urlColumn).setValue(directUrl);
  logEvent_('INFO', 'approveUpload', 'Upload dipublikasikan ke galeri.', { fileId: file.getId() });
}
