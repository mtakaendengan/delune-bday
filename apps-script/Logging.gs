function logEvent_(level, action, message, metadata) {
  try {
    var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    if (!id) return;
    var sheet = SpreadsheetApp.openById(id).getSheetByName('Logs');
    if (!sheet) return;
    sheet.appendRow([
      new Date(),
      String(level || 'INFO'),
      String(action || ''),
      String(message || '').slice(0, 500),
      JSON.stringify(metadata || {}).slice(0, 2000)
    ]);
  } catch (ignore) {
    console.error(ignore);
  }
}
