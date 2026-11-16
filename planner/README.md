# マイ手帳の起動方法

公開版: https://school-life-planner.kandodaiary.chatgpt.site/

Node.js 24 と npm を使用してください。リポジトリを取得後、以下を実行します。

```bash
cd planner
npm ci
npm run setup:local
npm run dev
```

表示されたlocalhostのURLを開いてください（通常 http://localhost:5173）。`setup:local` はビルドとローカルDBの初期化を行います。再実行時は適用済みのマイグレーションをスキップします。開発用ログインはlocalhost専用で、本物のChatGPT認証とは別です。公開版はSitesの認証を使い、利用者別のデータを保存します。ローカルのデータが公開版に送られることはありません。

```bash
npm test
npm run check
npm run build
```

GitHub Actionsでも同じ検査を実行します。GitHub Pagesはルートの学校案内を公開し、マイ手帳のサーバーはSitesで実行します。GitHub Actionsを常時稼働サーバーとして使う構成ではありません。公開版の起動入口は学校サイトの「マイ手帳」です。

---

# スクールライフ完全攻略 — マイ手帳

既存の公開学校案内から利用できる個人用手帳。SitesのChatGPT認証とD1で、利用者ごとに予定と振り返りを保存する。

## 実装

- `app/planner.tsx`: 今日の予定、月/週カレンダー、構造化振り返り、翌日タスク化、7日集計、書出し、非保存の操作体験。
- `app/chatgpt-auth.ts`: プラットフォームの認証ヘッダを読む既定ヘルパー。OAuthルートはプラットフォームが処理する。
- `app/api/planner/[[...path]]/route.ts`, `lib/server.ts`: サーバー側の認可、所有者条件付きSQL、同一Origin/JSON検査、CAS更新。GET/HTMLはno-store。
- `db/schema.ts`, `drizzle/`: 予定・振り返り。所有者IDはクライアントから受け取らない。
- `lib/model.ts`: JST日付、入力検証、時刻重複判定、明示的なルールに基づく分析。

## 検査・開発

`npm test` はNodeのSQLiteをD1相当の実行アダプタにして、実際のSQLとAPIを検査する。所有者分離、CSRF、CAS競合、削除復元、書出し、振り返り、日付・時刻境界、大量の過去タスクによる現在期間の欠落防止を含む。

`npx tsc --noEmit` で型検査。ビルドはSitesの `build-site.mjs` を使用する。D1は `.openai/hosting.json` の `DB` を利用し、スキーマ変更はDrizzleの追記マイグレーションで行う。秘密鍵・APIキーは不要。個人データをソースに入れない。

ローカルD1マイグレーションはビルド後、`node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_little_layla_miller.sql`。適用済みのマイグレーションを再実行しない。

## 制限

- 一度に2,000件まで表示。選択期間内を優先し、上限到達を表示する。書出しは全件対象。
- 日跨ぎ予定は日ごとに分割。繰返し予定・外部カレンダー同期・通知は未実装。
- 分析は保存記録の集計とガイド。生成AIの文章評価ではない。
- 削除した予定は直後の「元に戻す」で復元可能。振り返りは日付ごとに編集・再保存できる。
- デモはメモリ内だけで、再読込すると消える。ログイン済みデータへの自動移行はしない。
