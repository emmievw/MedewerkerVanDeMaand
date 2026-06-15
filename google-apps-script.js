// ============================================
// Google Apps Script - Medewerker van de Maand
// ============================================
//
// SETUP (eenmalig, 3 minuten):
//
// 1. Ga naar https://script.google.com → Nieuw project
// 2. Verwijder alle code en plak DEZE code
// 3. Klik bovenin op "Implementeren" → "Nieuwe implementatie"
// 4. Bij type: kies "Webapp"
//    - Uitvoeren als: Jezelf
//    - Wie heeft toegang: Iedereen
// 5. Klik "Implementeren"
// 6. Geef toestemming als daarom gevraagd wordt
// 7. Kopieer de URL die je krijgt
// 8. Plak die URL in main.js EN admin.js (de SCRIPT_URL variabele)
//
// Klaar! Stemmen worden opgeslagen in een Google Sheet
// die automatisch verschijnt in je Google Drive.
// ============================================

const SPREADSHEET_NAME = 'Medewerker van de Maand - Stemmen';
const SHEET_NAME = 'Juni 2026';

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'results') {
    return getResults();
  }

  return ContentService.createTextOutput(JSON.stringify({ error: 'Ongeldige actie' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    // Werkt met zowel application/json als text/plain
    const raw = e.postData.contents;
    const data = JSON.parse(raw);

    if (data.action === 'vote') {
      return submitVote(data);
    }

    return ContentService.createTextOutput(JSON.stringify({ error: 'Ongeldige actie' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet() {
  let ss;
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);

  if (files.hasNext()) {
    ss = SpreadsheetApp.open(files.next());
  } else {
    ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  }

  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Genomineerde', 'Motivatie']);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
  }

  return sheet;
}

function submitVote(data) {
  const sheet = getOrCreateSheet();

  sheet.appendRow([
    new Date().toISOString(),
    data.nominee,
    data.motivation
  ]);

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getResults() {
  const sheet = getOrCreateSheet();
  const data = sheet.getDataRange().getValues();

  const votes = [];
  const tally = {};

  for (let i = 1; i < data.length; i++) {
    const vote = {
      timestamp: data[i][0],
      nominee: data[i][1],
      motivation: data[i][2]
    };
    votes.push(vote);

    if (!tally[vote.nominee]) {
      tally[vote.nominee] = 0;
    }
    tally[vote.nominee]++;
  }

  const ranking = Object.entries(tally)
    .map(([name, voteCount]) => ({ name: name, votes: voteCount }))
    .sort((a, b) => b.votes - a.votes);

  const result = {
    totalVotes: votes.length,
    ranking: ranking,
    votes: votes.reverse()
  };

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
