/**
 * Entry point Web App.
 * Deploy: Execute as Me, Who has access: Anyone.
 */
function doGet(e) {
  var params = (e && e.parameter) || {};
  if (String(params.page || '').toLowerCase() === 'dashboard') {
    return HtmlService.createHtmlOutputFromFile('Dashboard')
      .setTitle('Dashboard Undangan Kania')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  }

  try {
    var action = String(params.action || 'health').toLowerCase();
    var callback = params.callback || '';

    if (action !== 'health') assertPublicAccess_(params.key);

    var result;
    switch (action) {
      case 'health':
        result = { ok: true, message: 'Birthday API aktif.', timestamp: new Date().toISOString() };
        break;
      case 'config':
        result = { ok: true, data: getPublicConfig_() };
        break;
      case 'wishes':
        result = { ok: true, data: getApprovedWishes_(params) };
        break;
      case 'gallery':
        result = { ok: true, data: getPublishedGallery_() };
        break;
      default:
        throw new Error('Action GET tidak dikenal.');
    }

    return output_(result, callback);
  } catch (error) {
    logEvent_('ERROR', 'doGet', error.message, { stack: error.stack });
    return output_({ ok: false, message: error.message || 'Terjadi kesalahan server.' }, params.callback || '');
  }
}

function doPost(e) {
  try {
    var payload = parsePayload_(e);
    var action = String(payload.action || '').toLowerCase();
    assertPublicAccess_(payload.key);

    var result;
    switch (action) {
      case 'wish':
        result = saveWish_(payload);
        break;
      case 'rsvp':
        result = saveRsvp_(payload);
        break;
      case 'upload':
        result = saveGuestUpload_(payload);
        break;
      default:
        throw new Error('Action POST tidak dikenal.');
    }

    return output_(result);
  } catch (error) {
    logEvent_('ERROR', 'doPost', error.message, { stack: error.stack });
    return output_({ ok: false, message: error.message || 'Terjadi kesalahan server.' });
  }
}

function parsePayload_(e) {
  if (!e) return {};
  var contents = e.postData && e.postData.contents;
  if (contents) {
    try {
      return JSON.parse(contents);
    } catch (ignore) {
      // Fallback untuk application/x-www-form-urlencoded.
    }
  }
  return e.parameter || {};
}

function output_(payload, callback) {
  var json = JSON.stringify(payload);
  var validCallback = /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(String(callback || ''));
  if (validCallback) {
    return ContentService.createTextOutput(String(callback) + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
