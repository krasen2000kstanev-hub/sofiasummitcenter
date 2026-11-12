// HR:Rush · team folders in Google Drive.
// Runs in Apps Script as the Drive owner (hr.rushforpractice@gmail.com), every 10 minutes.
// Finds the "Екип N - УНИ" folders, asks the platform who is in each team (/api/hrr/drive/sync)
// and shares or unshares each folder as the owner, so "editors can't share" stays on everywhere.
// It only removes people it added itself (remembered in Script Properties).
// First time: run setup() once. Pilot teams are set by HRR_DRIVE_ONLY in backend/wrangler.toml.
const ROOT = '1LKqGhzvvD-dtfpGHickXRmHC1x7Q00T8';
const API = 'https://sofiasummit-events-api.krasen2000-k-stanev.workers.dev/api/hrr/drive/sync';

function syncTeamFolders() {
  const started = Date.now(), folders = [], byId = {};
  const universities = DriveApp.getFolderById(ROOT).getFolders();
  while (universities.hasNext()) {
    const university = universities.next(), teams = university.getFolders();
    while (teams.hasNext()) {
      const folder = teams.next();
      if (!/Екип\s*\d+/i.test(folder.getName())) continue;
      folders.push({ id: folder.getId(), name: folder.getName(), university: university.getName() });
      byId[folder.getId()] = folder;
    }
  }
  const response = UrlFetchApp.fetch(API, { method: 'post', contentType: 'application/json', headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, payload: JSON.stringify({ folders }), muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) throw new Error('Платформата върна ' + response.getResponseCode() + ': ' + response.getContentText());
  const data = JSON.parse(response.getContentText()), props = PropertiesService.getScriptProperties();
  let added = 0, removed = 0;
  for (const id of new Set([...Object.keys(data.teams), ...props.getKeys()])) {
    if (Date.now() - started > 5 * 60 * 1000) break; // Apps Script stops at 6 min; the next run continues
    const folder = byId[id];
    if (!folder) { props.deleteProperty(id); continue; }
    const want = data.teams[id] || [], had = JSON.parse(props.getProperty(id) || '[]'), kept = [];
    for (const email of want) {
      if (had.includes(email)) { kept.push(email); continue; }
      try { folder.addEditor(email); kept.push(email); added++; } catch (error) { console.warn('Не мога да споделя ' + folder.getName() + ' с ' + email + ': ' + error.message); }
    }
    for (const email of had) {
      if (want.includes(email)) continue;
      try { folder.removeEditor(email); removed++; } catch (error) { console.warn('Не мога да махна ' + email + ' от ' + folder.getName() + ': ' + error.message); }
    }
    props.setProperty(id, JSON.stringify(kept));
  }
  console.log('Папки на екипи: ' + folders.length + ', дадени достъпи: ' + added + ', махнати: ' + removed + (data.missing.length ? ', екипи без папка: ' + data.missing.join(', ') : ''));
}

function setup() {
  ScriptApp.getProjectTriggers().forEach((trigger) => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('syncTeamFolders').timeBased().everyMinutes(10).create();
  syncTeamFolders();
}
