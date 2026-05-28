# 外線対応ロープレアプリ

求人広告代理店（aicorpo）の社員が、外線電話対応を繰り返し練習できる Web アプリです。
AI（Gemini）が架電者役を演じ、社員の応答を採点・フィードバックします。

## 構成

| ファイル | 役割 |
|---|---|
| `Code.gs` | GAS メインロジック（エントリーポイント・Gemini API 呼び出し・採点） |
| `Scenarios.gs` | シナリオデータ定義（初級・中級・上級 各3本 計9本） |
| `Prompt.gs` | Gemini API へ渡すプロンプトテンプレート（架電者役／採点） |
| `Index.html` | フロントエンド（UI 全体・4画面フロー） |
| `README.md` | このファイル |

## 機能

- 難易度（初級／中級／上級）から9本のシナリオを選択
- AI 架電者とのテキスト会話形式ロープレ
- 通話終了後、5項目（計100点）での自動採点
  - 第一声・挨拶 / 傾聴・確認 / 適切な対応 / 言葉遣い / 印象・姿勢
- 良かった点・改善点（模範セリフ例つき）のフィードバック
- 同じシナリオの再挑戦／別シナリオへの切り替え
- （任意）採点結果のスプレッドシート記録

## セットアップ手順

1. Google アカウントでログインする。
2. [Google Apps Script](https://script.google.com/) で新規プロジェクトを作成する。
3. 以下の4ファイルをプロジェクトに用意し、内容を貼り付ける。
   - `Code.gs`（既定の `コード.gs` を置き換え）
   - `Scenarios.gs`（「ファイル＋」→ スクリプトで追加）
   - `Prompt.gs`（同上）
   - `Index.html`（「ファイル＋」→ HTML で追加。**ファイル名は `Index`**）
4. [Google AI Studio](https://aistudio.google.com/app/apikey) で Gemini API キーを取得する。
5. GAS の「プロジェクトの設定」→「スクリプト プロパティ」に以下を追加する。

   | キー | 値 |
   |---|---|
   | `GEMINI_API_KEY` | 取得した Gemini API キー（必須） |
   | `SPREADSHEET_ID` | ログ記録用スプレッドシートの ID（任意） |

6. 「デプロイ」→「新しいデプロイ」→ 種類「**ウェブアプリ**」を選択。
   - 「次のユーザーとして実行」: **自分**
   - 「アクセスできるユーザー」: **全員**（社内共有なら適宜調整）
7. 発行された Web アプリ URL を社内に共有する。

## clasp でのデプロイ（CLI 派向け）

ブラウザでの貼り付けが面倒な場合は [clasp](https://github.com/google/clasp) でローカルから push できます。
本リポジトリには `appsscript.json`（マニフェスト）と `.claspignore` を同梱済みです。

```bash
# 1. clasp をインストール
npm install -g @google/clasp

# 2. Google にログイン
clasp login

# 3-A. 新規プロジェクトを作る場合（このフォルダ内で実行）
clasp create --type webapp --title "外線対応ロープレ" --rootDir .

# 3-B. 既存プロジェクトに紐付ける場合
clasp clone <スクリプトID> --rootDir .

# 4. ソースを push
clasp push

# 5. ウェブアプリとしてデプロイ
clasp deploy --description "v1"
```

> 事前に [Apps Script の API 利用](https://script.google.com/home/usersettings) を ON にしておく必要があります。
> `clasp create` 実行時に `appsscript.json` が既にあると上書き確認が出るので、同梱のマニフェストを保持してください。
> `.clasp.json`（スクリプトIDを含む）は `clasp create`/`clone` 時に自動生成され、環境依存のためコミット対象外にしています。

## ログ記録について（任意）

`SPREADSHEET_ID` を設定すると、採点のたびに対象スプレッドシートの `logs` シートへ
`日時 / ユーザー名 / シナリオID / スコア` が追記されます。未設定の場合は何もしません。

## 動作の流れ

```
[TOP] 難易度選択
  ↓
[シナリオ選択] 該当難易度の一覧
  ↓
[ロープレ] 架電者情報 → AIの第一声 → 応答入力 → 会話継続 → 通話終了
  ↓
[採点] 総合スコア・項目別評価・良かった点・改善点
```

## 技術メモ

- フロント／バックエンドの通信は `google.script.run` を使用。
- Gemini API は `UrlFetchApp` で呼び出し（`gemini-1.5-flash`）。
- API キーはスクリプトプロパティから取得し、コードにはハードコードしない。
- Gemini のレスポンス JSON パースは `try-catch` で保護。採点 JSON はコードフェンス除去・
  `{...}` 抽出のフォールバック付きでパースする。

## カスタマイズ

- シナリオの追加・編集は `Scenarios.gs` の `SCENARIOS` 配列を編集する。
- 採点基準やプロンプトの調整は `Prompt.gs` を編集する。
- 使用モデルの変更は `Code.gs` の `GEMINI_MODEL` を変更する。
