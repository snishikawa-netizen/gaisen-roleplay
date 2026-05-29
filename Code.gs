/**
 * Code.gs
 * 外線対応ロープレアプリのバックエンド（GAS）。
 *
 * フロントエンド（Index.html）とは google.script.run で通信する。
 * Gemini API は UrlFetchApp で呼び出す。
 *
 * 公開関数（フロントから呼ばれる）:
 *   - getScenarios()                         : シナリオ一覧を返す
 *   - getNextCallerReply(scenarioId, log)    : 架電者役の次のセリフを返す
 *   - scoreRoleplay(scenarioId, log)         : 会話を採点して返す
 */

var GEMINI_MODEL = 'gemini-2.5-flash';
var GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/' +
  GEMINI_MODEL + ':generateContent';

// 音声合成（TTS）用モデルと既定ボイス
var GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts';
var DEFAULT_TTS_VOICE = 'Kore';

// ===================================================================
// Web アプリのエントリーポイント
// ===================================================================

/**
 * Web アプリの GET エントリーポイント。Index.html を配信する。
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('外線対応ロープレ | aicorpo')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * POST エントリーポイント。
 * 本アプリのフロントは google.script.run を使うため通常は未使用だが、
 * 外部から JSON で叩きたい場合のフォールバックとして用意する。
 * body: { action: "reply"|"score", scenarioId: "...", log: [...] }
 */
function doPost(e) {
  var result;
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.action === 'scenarios') {
      result = getScenarios();
    } else if (body.action === 'reply') {
      result = getNextCallerReply(body.scenarioId, body.log);
    } else if (body.action === 'score') {
      result = scoreRoleplay(body.scenarioId, body.log);
    } else if (body.action === 'tts') {
      result = ttsGenerate(body.text, body.voice);
    } else {
      result = { error: 'unknown action: ' + body.action };
    }
  } catch (err) {
    result = { error: String(err) };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===================================================================
// フロントから呼ばれる公開関数
// ===================================================================

/**
 * シナリオ一覧を難易度ごとにまとめて返す。
 * @return {Object} { beginner:[...], intermediate:[...], advanced:[...], labels:{...} }
 */
function getScenarios() {
  var all = getAllScenarios();
  var grouped = { beginner: [], intermediate: [], advanced: [] };
  all.forEach(function (s) {
    // フロントには personality・架電者の実名/社名は渡さない（ロープレのリアリティのため）
    var view = {
      id: s.id,
      difficulty: s.difficulty,
      title: s.title,
      first_message: s.first_message,
      identifies_on_opening: s.identifies_on_opening === true,
      voice: s.voice || DEFAULT_SCENARIO_VOICE
    };
    if (grouped[s.difficulty]) {
      grouped[s.difficulty].push(view);
    }
  });
  return { groups: grouped, labels: DIFFICULTY_LABELS };
}

/**
 * 架電者役（AI）の次のセリフを生成して返す。
 * @param {string} scenarioId
 * @param {Array<Object>} conversationLog - [{role:'caller'|'staff', text:'...'}, ...]
 *        先頭は架電者の first_message を含む想定。
 * @return {Object} { reply: string, ended: boolean }
 */
function getNextCallerReply(scenarioId, conversationLog) {
  var scenario = getScenarioById(scenarioId);
  if (!scenario) {
    throw new Error('シナリオが見つかりません: ' + scenarioId);
  }

  var systemPrompt = buildCallerSystemPrompt(scenario);

  // contents は「user（応対者）」から始める必要があるため、
  // 先頭の架電者 first_message は除外し、それ以降を渡す。
  var turns = (conversationLog || []).filter(function (t, i) {
    return !(i === 0 && t.role === 'caller');
  });

  var contents = turns.map(function (t) {
    return {
      role: (t.role === 'staff') ? 'user' : 'model',
      parts: [{ text: t.text }]
    };
  });

  // 念のため、先頭が user でない場合は安全側に倒す
  if (contents.length === 0 || contents[0].role !== 'user') {
    contents.unshift({ role: 'user', parts: [{ text: '（応対者が応答します）' }] });
  }

  var reply = callGeminiAPI(contents, systemPrompt, { temperature: 0.9, maxOutputTokens: 512 });
  reply = (reply || '').trim();

  var ended = isCallEnded(reply);
  return { reply: reply, ended: ended };
}

/**
 * 会話記録を採点して返す。
 * @param {string} scenarioId
 * @param {Array<Object>} conversationLog
 * @return {Object} 採点結果（仕様書 6-2 の JSON 構造）
 */
function scoreRoleplay(scenarioId, conversationLog) {
  var scenario = getScenarioById(scenarioId);
  if (!scenario) {
    throw new Error('シナリオが見つかりません: ' + scenarioId);
  }

  var prompt = buildScoringPrompt(scenario, conversationLog || []);
  var contents = [{ role: 'user', parts: [{ text: prompt }] }];

  var raw = callGeminiAPI(contents, null, {
    temperature: 0.4,
    maxOutputTokens: 2048,
    responseMimeType: 'application/json'
  });
  var result = parseScoringJson(raw);

  // 任意: ログ記録（SPREADSHEET_ID 未設定なら何もしない）
  try {
    logResult('', scenarioId, result.total_score);
  } catch (err) {
    // ログ失敗は採点結果に影響させない
  }

  return result;
}

// ===================================================================
// Gemini API 呼び出し
// ===================================================================

/**
 * Gemini API を呼び出す共通関数。
 * @param {Array<Object>} contents - Gemini の contents 配列
 * @param {string|null} systemPrompt - システムプロンプト（不要なら null）
 * @return {string} モデルが生成したテキスト
 */
function callGeminiAPI(contents, systemPrompt, options) {
  options = options || {};
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('スクリプトプロパティ GEMINI_API_KEY が設定されていません。');
  }

  var genConfig = {
    temperature: (options.temperature != null ? options.temperature : 0.8),
    maxOutputTokens: options.maxOutputTokens || 1024,
    // 2.5系は既定で「思考」に出力トークンを消費するため無効化（高速化＆出力確保）
    thinkingConfig: { thinkingBudget: 0 }
  };
  if (options.responseMimeType) {
    genConfig.responseMimeType = options.responseMimeType;
  }

  var payload = {
    contents: contents,
    generationConfig: genConfig
  };
  if (systemPrompt) {
    payload.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(GEMINI_ENDPOINT + '?key=' + apiKey, options);
  var code = response.getResponseCode();
  var text = response.getContentText();

  if (code !== 200) {
    throw new Error('Gemini API エラー (HTTP ' + code + '): ' + text);
  }

  var json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new Error('Gemini レスポンスのJSONパースに失敗しました: ' + text);
  }

  if (json.promptFeedback && json.promptFeedback.blockReason) {
    throw new Error('リクエストがブロックされました: ' + json.promptFeedback.blockReason);
  }

  try {
    return json.candidates[0].content.parts[0].text;
  } catch (err) {
    throw new Error('Gemini レスポンスから本文を取得できませんでした: ' + text);
  }
}

// ===================================================================
// 音声合成（Gemini TTS）
// ===================================================================

/**
 * テキストを Gemini TTS で音声化し、base64音声と mimeType を返す。
 * @param {string} text - 読み上げる日本語テキスト
 * @param {string} voiceName - Gemini のプリセットボイス名（例: 'Kore'）
 * @return {Object} { audio: base64文字列(PCM 16bit LE mono), mimeType: 'audio/L16;...rate=24000' }
 */
function ttsGenerate(text, voiceName) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('スクリプトプロパティ GEMINI_API_KEY が設定されていません。');
  }
  if (!text) {
    throw new Error('読み上げるテキストが空です。');
  }

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
    GEMINI_TTS_MODEL + ':generateContent?key=' + apiKey;

  var payload = {
    contents: [{ parts: [{ text: text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName || DEFAULT_TTS_VOICE }
        }
      }
    }
  };

  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var code = res.getResponseCode();
  var textBody = res.getContentText();
  if (code !== 200) {
    throw new Error('TTS APIエラー (HTTP ' + code + '): ' + textBody);
  }

  var json;
  try {
    json = JSON.parse(textBody);
  } catch (err) {
    throw new Error('TTSレスポンスのJSONパースに失敗しました: ' + textBody);
  }

  try {
    var part = json.candidates[0].content.parts[0];
    return { audio: part.inlineData.data, mimeType: part.inlineData.mimeType };
  } catch (err) {
    throw new Error('TTSレスポンスから音声を取得できませんでした: ' + textBody);
  }
}

// ===================================================================
// ヘルパー
// ===================================================================

/**
 * 架電者の発話から通話終了かどうかを判定する簡易ヒューリスティック。
 * @param {string} reply
 * @return {boolean}
 */
function isCallEnded(reply) {
  if (!reply) return false;
  var endPhrases = ['失礼します', '失礼いたします', 'それでは失礼', '電話を切', 'ガチャ'];
  for (var i = 0; i < endPhrases.length; i++) {
    if (reply.indexOf(endPhrases[i]) !== -1) {
      return true;
    }
  }
  return false;
}

/**
 * 採点プロンプトのレスポンス文字列を JSON にパースする。
 * モデルが ```json ... ``` で囲んだり前後に文を付けても拾えるようにする。
 * @param {string} raw
 * @return {Object}
 */
function parseScoringJson(raw) {
  if (!raw) {
    throw new Error('採点結果が空です。');
  }

  var text = raw.trim();

  // ```json ... ``` のコードフェンスを除去
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  try {
    return JSON.parse(text);
  } catch (err) {
    // 最初の { から最後の } までを抜き出して再挑戦
    var start = text.indexOf('{');
    var end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      var sliced = text.substring(start, end + 1);
      try {
        return JSON.parse(sliced);
      } catch (err2) {
        throw new Error('採点JSONのパースに失敗しました: ' + raw);
      }
    }
    throw new Error('採点JSONのパースに失敗しました: ' + raw);
  }
}

// ===================================================================
// ログ記録（任意）
// ===================================================================

/**
 * 採点結果をスプレッドシートに記録する（任意機能）。
 * SPREADSHEET_ID が未設定の場合は何もしない。
 * @param {string} userName
 * @param {string} scenarioId
 * @param {number} score
 */
function logResult(userName, scenarioId, score) {
  var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!ssId) {
    return; // ログ機能は任意
  }

  var ss = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheetByName('logs') || ss.insertSheet('logs');

  // ヘッダー行が無ければ作成
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['日時', 'ユーザー名', 'シナリオID', 'スコア']);
  }

  var scenario = getScenarioById(scenarioId);
  var label = scenario ? (scenario.id + ' ' + scenario.title) : scenarioId;

  sheet.appendRow([new Date(), userName || '匿名', label, score]);
}
