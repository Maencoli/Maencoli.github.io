/**
 * 2027 달력 예약 → 구글 시트 접수
 *
 * 구글 시트(0h.miinah@gmail.com 계정)에서 확장 프로그램 > Apps Script 를 열고
 * 이 파일 내용을 통째로 붙여넣은 뒤, 웹 앱으로 배포하세요. 자세한 순서는 README.md.
 */

const SHEET_NAME = '예약';
const HEADERS = ['접수 시각', '이름', '이메일', '연락처', '수량', '남길 말'];
const MAX_QTY = 10;

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // 스팸봇 함정 칸이 채워져 있으면 저장하지 않고 성공인 척만 해요.
    if (data.website) return json_({ ok: true });

    const name = clean_(data.name, 50);
    const email = clean_(data.email, 100);
    const phone = clean_(data.phone, 30);
    const message = clean_(data.message, 1000);
    const quantity = Math.min(MAX_QTY, Math.max(1, parseInt(data.quantity, 10) || 1));

    if (!name) return json_({ ok: false, error: 'name' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json_({ ok: false, error: 'email' });

    lock.waitLock(10000);
    const sheet = getSheet_();
    sheet.appendRow([new Date(), name, email, phone, quantity, message]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// 브라우저로 웹 앱 주소를 열었을 때 살아있는지 확인용
function doGet() {
  return json_({ ok: true, service: '2027 calendar reservation' });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

// 앞뒤 공백 제거, 길이 제한, 시트 수식 주입 방지(=, +, -, @ 로 시작하면 ' 붙임)
function clean_(v, max) {
  let s = String(v == null ? '' : v).trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
