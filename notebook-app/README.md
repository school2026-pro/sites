# マイ手帳 — Firebase版

メール・パスワードで使う個人用の予定・振り返り・カレンダー。
GitHub Pagesの `/sites/notebook/` に配置する静的Reactアプリです。

## 現在の状態（2026-11-17）

- Firebaseプロジェクト: school-pro-a9d2a。メール/パスワード認証は有効。
- Enterprise native Firestore: database ID `default`、東京 asia-northeast1、リアルタイム更新オン、Sparkプラン。
- フロントエンド・保存処理・セキュリティルールを実装、ビルド成功。
- 別AIによる独立レビューを実施。表示件数による欠落、編集後の追従、購読エラー復旧を修正。
- ルールの54 assertionsがEnterpriseエミュレータで成功。
- 本番Firestoreルールを2026-11-17に公開。GitHubへ静的版を配置。実アカウントの新規登録・保存は本人による最終確認が必要です。
- Googleログインは未有効。運営者の個人用サポートメールを公開しないため。
- 旧手帳の記録の自動移行は実装していません。旧サービスは維持します。

## 実行とビルド

```sh
npm ci
npm run dev
npm run build
```

ビルド成果物は `../notebook/`。公開パスは `/sites/notebook/`。
開発サーバーも `http://127.0.0.1:5173/sites/notebook/` を開きます。

## 本番の接続

1. Firebase Consoleで school-pro-a9d2a → Firestore → `default` → セキュリティを開く。
2. `firestore.rules` の内容を入力し、公開前に対象が上記databaseであることを確認。
3. 検証済みルールを公開。本番環境でアカウント別の保存・再ログイン・分離を確認。
4. `../notebook/` の成果物と本ソースをGitHubへ配置。Jekyllから `notebook-app/` を除外。
5. 学校案内の手帳リンクを相対URL `notebook/` へ変更。ChatGPT認証の説明をメール認証へ更新。
6. Pagesデプロイ成功後、スマホ画面・保存・再読込・削除復元・ログアウトを確認。

Firebaseの公開用Web設定はソース内にあります。管理者キー・秘密鍵は含みません。
個人データはFirestoreのUIDスコープとルールで保護します。

## ルールのテスト

Java21以上とFirebase CLIを使用します。CLIログイン不要のローカルテストです。

```sh
npx -y firebase-tools@latest emulators:exec --only firestore --project demo-school-notebook 'node tests/rules.test.mjs'
```

本番へのCLI反映は、所有者がCLIに認証済みの場合のみ、明示したプロジェクトへ行います。

```sh
npx -y firebase-tools@latest deploy --only firestore:rules --project school-pro-a9d2a
```

## プライバシーと仕様

- 所有者のUIDパス以外は拒否。匿名・他利用者の取得/一覧/書込を拒否。
- 各フィールドの型・長さ・列挙値とversionを作成/更新の両方で検査。
- 作成時刻は不変、更新時刻はサーバー時刻。競合時は上書きせず再編集を案内。
- 予定の削除は復元可能なsoft delete。別利用者の記録や親文書は読みません。
- 通常はセッション認証。端末にログインを保持する場合は本人が明示的に選択。
- Firestoreの永続ディスクキャッシュは有効にしません。ログアウト時は画面と購読を破棄。
- 全件リアルタイム購読で記録/書出しの欠落を避けています。初回の読込量は本人の記録量に比例します。
- 日付はカレンダー用のdate-only文字列。UIは実在する日付を厳密検証。Rulesは書式/範囲のみなので、直接SDKから自己データへ暦上不正な日付を送る余地があります。他利用者への権限には影響しません。
- 振り返り支援は記録に基づく集計とガイド。生成AI文章評価ではありません。
- Rulesは試作として独立レビューとローカルテストを実施したものです。広く共有する前に本番の実ユーザー間の分離も検証してください。
- Firebase作成者の個人メールを画面・設定・送信元へ埋め込みません。ただし既存の公開GitHubコミット履歴には作者メールが含まれます。サイト画面から消しても履歴は消えません。履歴は今回変更していません。
