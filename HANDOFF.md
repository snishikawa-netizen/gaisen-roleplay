# 引き継ぎ書（外線対応ロープレアプリ）

最終更新: 2026-06-02 / GitHub commit `4e978b1`（origin/main にpush済み）・GASデプロイ **@16**

このドキュメントは、開発を **Cursor** で引き継ぐための申し送りです。
**重要: 当初の仕様書（`gaisen_roleplay_spec.md`）から構成が大きく変わっています。** 必ず本書の「構成」を先に読んでください。

---

## 1. アプリ概要

求人広告代理店「aicorpo」の社員が**外線電話対応を音声で練習**するWebアプリ。
- AI（Gemini）が架電者役を演じる
- ユーザーは**マイクで音声応対**（音声認識でテキスト化）
- AIの返答は**自然な音声で読み上げ**（Gemini TTS）
- 通話終了で**5項目100点満点の採点・フィードバック**

画面フロー: TOP（難易度選択）→ シナリオ選択 → ロープレ（音声会話）→ 採点

---

## 2. 構成（★当初仕様から変更）

当初は「GASのウェブアプリ単体」を想定していたが、**GASのiframe内ではマイク（音声認識）がブラウザのPermissions Policyでブロックされる**ことが判明。
そのため以下の構成に変更した:

```
[フロントエンド] GitHub Pages (HTTPS・トップレベルページ → マイク利用可)
        │  fetch (POST, Content-Type: text/plain でCORSプリフライト回避)
        ▼
[バックエンドAPI] Google Apps Script の doPost（JSON API）
        │  UrlFetchApp
        ▼
[AI] Gemini API（会話: gemini-2.5-flash / 音声合成: gemini-2.5-flash-preview-tts）
```

- フロント（`Index.html`）は GitHub Pages から配信。マイクは**トップレベルページなら使える**。
- GAS は **doPost のJSON APIとして利用**（`doGet`でHTMLも返せるが、そちらはiframe内なのでマイク不可。実運用はPages版を使う）。
- 音声認識は **Web Speech API（`webkitSpeechRecognition`, Chrome/Edge専用）**。
- 音声読み上げは **Gemini TTS**（端末の音声合成は品質が低くロボ声だったため不採用。フォールバックとして端末音声も選択可）。

---

## 3. URL・ID一覧

| 項目 | 値 |
|---|---|
| **共有用アプリURL（これを配る）** | https://snishikawa-netizen.github.io/gaisen-roleplay/Index.html |
| GitHubリポジトリ | https://github.com/snishikawa-netizen/gaisen-roleplay |
| GAS APIエンドポイント（`Index.html` の `API_URL`） | https://script.google.com/macros/s/AKfycbx_gOUv7ltgQDeXLd2zCh5mz4oFJvYOYrILa8BDEP0W7D0pCAmOfjuPPBoIpHx9faWp/exec |
| GASスクリプトエディタ | https://script.google.com/d/1PrYF6L3ALy5yGGfgttm-RoZmahOE00PIq131770FLWywpofWGhG2dBwe/edit |
| GAS scriptId | `1PrYF6L3ALy5yGGfgttm-RoZmahOE00PIq131770FLWywpofWGhG2dBwe` |
| GAS デプロイID（**この同じIDに再デプロイすればURL不変**） | `AKfycbx_gOUv7ltgQDeXLd2zCh5mz4oFJvYOYrILa8BDEP0W7D0pCAmOfjuPPBoIpHx9faWp` |
| ローカル作業ディレクトリ | `C:\Users\s.nishikawa\Documents\アプリ\roleplay` |

> GASアカウント: `s.nishikawa@aicorpo.com` / GitHubアカウント: `snishikawa-netizen`

### 課金（Gemini API・2026-06-02 有料化）
| 項目 | 値 |
|---|---|
| キーの所属プロジェクト | **gemini-roleplay**（`gemini-roleplay-497706`） |
| 請求先アカウント（リンク済み） | `01D7B1-72BD67-DFC3E0` |
| ティア | **有料 Tier 1**（月上限 $250） |
| 支払い方式 | **前払い（プリペイド）**。Gemini APIは新規ユーザー前払いのみ（後払いはTier 3以降） |
| クレジット購入 | https://aistudio.google.com/billing →「クレジットを購入」（最低 ¥2,000） |
| 予算アラート | ¥500 / ¥900 / ¥1,000 でメール通知（請求先01D7B1に設定済み） |

> **残高0でAPI停止＝実質ハードキャップ**。残高は `https://aistudio.google.com/billing` で確認・補充。
> 補充の権限は「お支払いプロファイル（カード）」を持つ **`nishikawa0826@gmail.com`** 側にある（aicorpoは請求先の管理者だがカード編集不可）。

---

## 4. ファイル構成

| ファイル | 役割 | 配信先 |
|---|---|---|
| `Index.html` | フロント全体（UI・音声認識・TTS再生・fetch通信） | GitHub Pages **と** GAS |
| `Code.gs` | バックエンド。`doGet`/`doPost`、Gemini呼び出し、採点、TTS生成、ログ | GAS |
| `Scenarios.gs` | シナリオ15本（初級/中級/上級 各5本） | GAS |
| `Prompt.gs` | 架電者役プロンプト・採点プロンプト | GAS |
| `appsscript.json` | GASマニフェスト（webアプリ設定: 実行=自分 / アクセス=全員匿名） | GAS |
| `.claspignore` | clasp push対象を上記.gs/html/jsonに限定 | - |
| `.gitignore` | `.clasp.json` 等を除外 | - |
| `README.md` | セットアップ手順（※**内容が旧構成のままで未更新**） | - |

### doPost のアクション（`Index.html` の `callServer` が叩く）
- `scenarios` → `getScenarios()`（シナリオ一覧）
- `reply` → `getNextCallerReply(scenarioId, log)`（架電者の次の発話）
- `score` → `scoreRoleplay(scenarioId, log)`（採点JSON）
- `tts` → `ttsGenerate(text, voice)`（base64 PCM音声 + mimeType）

---

## 5. 変更の反映手順（重要）

### フロント（`Index.html`）を変えたとき
GitHub Pages配信なので **git push すれば自動再ビルド（約30秒）**。
```bash
git add Index.html && git commit -m "..." && git push origin main
# 反映確認: 数十秒後にハードリロード（Ctrl+Shift+R）
```
※ あわせてGAS側のdoGet版も揃えたい場合は下記clasp pushも実行（必須ではない）。

### バックエンド（`*.gs` / `appsscript.json`）を変えたとき
clasp で push → **同じデプロイIDに再デプロイ（URL不変）**:
```bash
clasp push -f
clasp deploy -i AKfycbx_gOUv7ltgQDeXLd2zCh5mz4oFJvYOYrILa8BDEP0W7D0pCAmOfjuPPBoIpHx9faWp -d "vXX 説明"
```
> `clasp deploy`（-iなし）だと**新しいURLが発行される**ので注意。必ず `-i` で既存IDを更新する。

### 環境
- clasp 3.3.0（`clasp login` 済み・認証情報は `~/.clasprc.json`）
- gh 2.92.0（`snishikawa-netizen` で認証済み）
- node v24 / npm 11
- **`GEMINI_API_KEY` はGASのスクリプトプロパティに保存**（リポジトリには無い・コミットしない）

---

## 6. ローカルでフロントを動かす（マイク検証用）

GitHub Pages本番を触らずに試すには、localhostで配信する（localhostはセキュアコンテキストなのでマイク可）。
```bash
cd "C:\Users\s.nishikawa\Documents\アプリ\roleplay"
node -e "const http=require('http'),fs=require('fs'),path=require('path');const root=process.cwd();http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/Index.html';fs.readFile(path.join(root,p),(e,d)=>{if(e){s.writeHead(404);s.end('nf');return;}const t={'.html':'text/html; charset=utf-8'}[path.extname(p)]||'application/octet-stream';s.writeHead(200,{'Content-Type':t});s.end(d);});}).listen(8123,'127.0.0.1',()=>console.log('http://localhost:8123'));"
```
→ ブラウザで http://localhost:8123 を開く。`Index.html` は `google.script.run` が無い環境では `API_URL`（GAS）へ `fetch` する。

### GASのAPIをキーを晒さず検証する（curl）
GASは `/exec` にPOST→302→`googleusercontent.com/echo` にGETでJSONが返る。
```bash
URL="https://script.google.com/macros/s/AKfycbx_gOUv7ltgQDeXLd2zCh5mz4oFJvYOYrILa8BDEP0W7D0pCAmOfjuPPBoIpHx9faWp/exec"
# 日本語ボディは文字化け回避のためファイルに書いて送る
node -e "require('fs').writeFileSync('.b.json',JSON.stringify({action:'scenarios'}))"
LOC=$(curl -s --http1.1 -o /dev/null -D - -X POST "$URL" -H "Content-Type: text/plain;charset=utf-8" --data-binary @.b.json | grep -i '^location:' | sed 's/location: //I' | tr -d '\r')
curl -s --http1.1 "$LOC"
```

---

## 7. ハマりどころ（学んだこと・再発防止）

1. **GAS iframe ではマイク不可**（`not-allowed`）。音声入力を使うならフロントは必ずGAS外（Pages等トップレベル）に置く。
2. **CORS**: GASへ `fetch` する際は `Content-Type: text/plain` にしてプリフライトを回避する。GASの応答には `Access-Control-Allow-Origin: *` が付くので読める（確認済み）。`application/json` にすると preflight が発生し失敗する。
3. **モデル**: `gemini-1.5-flash` は提供終了（404）。`gemini-2.0-flash` はこのキーで**無料枠 limit:0**（429）。**`gemini-2.5-flash` を使用**（無料枠OK・確認済み）。
4. **gemini-2.5系の「思考」**: 既定で思考トークンを消費し、`maxOutputTokens` 内で**出力JSONが途中で切れる**。`callGeminiAPI` で `thinkingConfig.thinkingBudget=0` を指定。採点は `responseMimeType:'application/json'` + 出力上限2048で確実化。
5. **callServer のペイロード**: fetchボディに全フィールドを載せること（過去に `text`/`voice` を送り忘れてTTSが毎回端末音声にフォールバックするバグがあった）。
6. **Gemini TTSの音声**: `gemini-2.5-flash-preview-tts` が base64 の **PCM(L16/24kHz/mono)** を返す。`<audio>` は生PCMを再生できないので、フロントで**WAVヘッダを付けて再生**している（`pcmBase64ToAudio`）。
6b. **Gemini TTSの枠（重要・実測で判明）**: `gemini-2.5-flash-preview-tts` の無料枠で本当に効く制約は **毎分ではなく「1日10回（RequestsPerDayPerProjectPerModel）」**。だからロープレ1〜2回で枯渇し、待っても当日は戻らない（リセットは太平洋時間の翌日）。**Cloud無料トライアルのクレジット(¥47,819)はGemini APIには使えない**点に注意（対象外プロダクト）。→ **2026-06-02に有料Tier 1へ移行＋前払い¥2,000で恒久解決**（§3課金参照）。クライアントは枠超過時に端末音声へ自動フォールバック、`isTtsDailyQuotaError` で日次超過を検知すると長め休止＋「本日の枠超過」を明示。端末音声は `pickBestLocalVoice()` で最も自然な声を選択。同一セリフは `ttsCache` で再生成しない。
7. **音声認識の途切れ／ターン未送信**: `continuous=true` でもChromeは無音で勝手に `onend` を発火する。放置すると「マイクを押しても進まない／言い直し」になるため、`wantListening`（聞き取り継続の意図）フラグで**意図しないonendは認識テキストを保持して自動再開**し、ユーザーの送信操作（`stopListening`）時のみ送信する。手動はマイク再押下で送信、ハンズフリーは**無音2.5秒**で自動送信（`resetSilenceTimer`、秒数は調整可）。中断は `cleanupVoice` が `aborting` を立てて送信・再開を抑止。
8. **ファイル名の大小**: Windowsは大小区別なし。GitHub/GASは区別あり。ファイルは `Index.html`（大文字I）。Pagesのトップ `/` ではなく **`/Index.html`** でアクセスする点に注意（`index.html`小文字は作っていない）。

---

## 8. 既知の懸念・TODO（任意の改善余地）

- [ ] **アクセス制限（有料化で重要度UP）**: Pagesは公開・GASは匿名アクセス可のため、**URLを知る誰でも前払いクレジットを消費**できる。社内限定運用が前提。残高は前払い¥2,000で上限管理されるが、合言葉ゲート等の追加を検討する価値あり。
- [ ] **README.md が旧構成のまま**（GAS単体前提の記述）。現構成（Pages+GAS API+音声）に更新するとよい。
- [x] **架電者情報の非表示**: ロープレ中は「外線着信・発信者不明」。シナリオ一覧も社名/用件非表示。`identifies_on_opening` で名乗りあり/なしを分岐（採点で所属確認を評価）。
- [x] **TTSロボ声の恒久対策**: 原因は無料枠の日次10回上限。**有料Tier 1＋前払い¥2,000で解決**（§3課金・§7-6b）。残高補充はgmail側で（§3注記）。
- [x] **マイク押下でターンが進まない**: ChromeのonEnd暴発が原因。`wantListening`で再開制御し送信時のみ送信（§7-7）。
- [ ] git のコミット作者が自動値（`西川 新也 <s.nishikawa@local.aicorpo.com>`）。必要なら `git config user.name/email` を設定。
- [ ] 音声生成のたびに1〜3秒の待ち（Gemini TTS）。気になる場合は短文化・プリフェッチ等を検討。
- [ ] ハンズフリーの無音判定2.5秒は体感次第で調整（`Index.html` の `resetSilenceTimer`）。
- [ ] スプレッドシートへのログ記録は任意（`SPREADSHEET_ID` 未設定なら何もしない）。

---

## 9. 採点基準（参考）

| 項目(key) | 配点 |
|---|---|
| 第一声・挨拶 (greeting) | 20 |
| 傾聴・確認 (listening) | 20 |
| 適切な対応 (response) | 25 |
| 言葉遣い (language) | 20 |
| 印象・姿勢 (attitude) | 15 |

採点レスポンスは `{ total_score, breakdown{...}, good_points[], improvements[{point, example}] }`。

---

## 10. 直近の状態（2026-06-02）

- 動作確認済み: シナリオ取得・音声認識・AI応答（gemini-2.5-flash）・Gemini TTS再生・採点、すべて疎通。**有料化後にTTSが連続成功することをAPI実測で確認**。
- **GitHub: `origin/main` に最新コミット `4e978b1` までpush済み**（Pages反映済み）。**GASデプロイ @16 反映済み**。`memo.txt` は未追跡の作業メモ。
- 今回の主な対応（2026-06-02・`4e978b1`）:
  - 音声認識: ChromeのonEnd暴発で「マイクを押しても進まない／言い直し」を修正（`wantListening` で再開制御）。
  - TTS: 日次枠超過(PerDay)の検知・明示、端末音声フォールバックを最も自然な声に、クールダウン90→60秒。
  - 採点: `maxOutputTokens` 2048→4096、`MAX_TOKENS` 検出を追加。
  - **Gemini APIを有料Tier 1へ移行＋前払い¥2,000**でロボ声を恒久解決（§3課金・§7-6b）。
- 残タスク（任意）: §8参照（アクセス制限、README更新、残高補充の運用など）。
- 採点エラーは一時的なGemini 503（過負荷）でも発生し得る。恒常的に出る場合のみ調査（トークン切れは§7-4で対策済み）。
