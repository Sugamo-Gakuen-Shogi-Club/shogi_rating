# Club Rivals セキュリティ設定手順書

## 防御の構造（全体像）

```
【メインアプリ】 (npm run build)
  ① APIキーA にドメイン制限      → yourapp.com 以外では動かない
  ② App Check (reCAPTCHA v3)    → ブラウザアプリ以外からのAPI直叩きを防ぐ
  ③ 管理者PIN                   → 部員による不正操作を防ぐ（既存）

          ↓ Firebase Rules で書き込みを制御 ↓

【/board ビルド】 (npm run build:board)
  ④ APIキーB（board専用）        → App Check 未登録 → 書き込み物理ブロック
  ⑤ APIキーB にドメイン制限      → board公開先ドメインのみ
  ⑥ readOnly モード              → UI上も編集ボタンが非表示
```

---

## ① Firebase Realtime Database ルール（最終版）

**Firebase Console → Realtime Database → 「ルール」タブ** に以下を貼り付けて「公開」。

```json
{
  "rules": {
    "rivals_data": {
      ".read": true,
      ".write": true,
      "users": {
        "$userId": {
          ".validate": "newData.hasChildren(['id','name','rate','wins','losses','draws','totalPoints'])"
        }
      },
      "matches": {
        "$matchId": {
          ".validate": "newData.child('result').val() === 'PLAYER1_WIN' || newData.child('result').val() === 'PLAYER2_WIN' || newData.child('result').val() === 'DRAW'"
        }
      }
    },
    "maintenance_backup":  { ".read": true, ".write": true },
    "maintenance_sandbox": { ".read": true, ".write": true },
    "$other": { ".read": false, ".write": false }
  }
}
```

### ポイント
- **Realtime Database のルールでは `request.appCheck` は使えません**（Firestore 専用の構文）
- App Check の強制は Firebase Console のスイッチで行います（下記③参照）
- `.write: true` のままでOK。App Check 強制をONにするとトークンのないリクエストが自動でブロックされる
- `.read: true` のまま → ランキング表示は誰でもできる
- `$other` → 未知のパスへのアクセスは全拒否

---

## ② App Check の設定（reCAPTCHA v3）

メインアプリの書き込みを「本物のブラウザ経由のみ」に制限する。

### 手順

**ステップ 1 — reCAPTCHA サイトキーを取得**
1. https://www.google.com/recaptcha/admin を開く
2. 「＋」でサイトを追加
   - ラベル：`club-rivals`
   - タイプ：`スコアベース（v3）`
   - ドメイン：デプロイ先のドメイン（例：`yourapp.netlify.app`）を追加
3. 「サイトキー」をコピー

**ステップ 2 — Firebase Console で App Check を設定**
1. https://console.firebase.google.com → プロジェクトを選択
2. 左メニュー「App Check」→「使ってみる」
3. ウェブアプリを選択 → プロバイダ「reCAPTCHA v3」
4. ステップ1で取得したサイトキーを貼り付けて登録
5. 「強制モード」を **OFF のまま** にする（まずモニタリングで確認）

**ステップ 3 — .env.local に追記**
```
VITE_RECAPTCHA_SITE_KEY=取得したサイトキー
```

**ステップ 4 — デプロイして動作確認**
- Firebase Console → App Check → 「リクエスト」で通過を確認
- 問題なければ Firebase Console で「強制モード」を ON にする

**ステップ 5 — Realtime Database の App Check 強制を有効化**
1. Firebase Console → App Check → 「API」タブ
2. 一覧に「Realtime Database」があるのでクリック
3. 「強制」ボタンを押す
→ これでApp Checkトークンのないリクエスト（boardビルドや外部の直叩き）が自動でブロックされます
→ Database ルールは `.write: true` のままで構いません（ルールの書き換えは不要）

---

## ③ APIキーA（メインアプリ）のドメイン制限

メインアプリの API キーが他ドメインで使われるのを防ぐ。

### 手順

1. https://console.cloud.google.com → プロジェクトを選択
2. 「API とサービス」→「認証情報」→ API キーの一覧を開く
3. メインアプリのキー（`VITE_FIREBASE_API_KEY`）をクリック
4. 「アプリケーションの制限」→「HTTP リファラー（ウェブサイト）」を選択
5. 以下のパターンを追加：
   ```
   https://yourapp.netlify.app/*
   https://yourapp.netlify.app
   http://localhost:3000/*      ← 開発用
   ```
6. 「保存」

---

## ④ /board 専用 APIキーB の作成

board ビルドには App Check を登録しない専用キーを使うことで、Firebase Rules が書き込みを物理ブロックする。

### 手順

**ステップ 1 — Firebase Console でウェブアプリを追加**
1. Firebase Console → プロジェクトの設定 → 「マイアプリ」タブ
2. 「アプリを追加」→「ウェブ」
3. アプリのニックネーム：`club-rivals-board`
4. 「アプリを登録」をクリック
5. 表示された `firebaseConfig` の `apiKey` と `appId` をメモ

**ステップ 2 — .env.local に追記**
```
VITE_BOARD_FIREBASE_API_KEY=ステップ1でメモした apiKey
VITE_BOARD_FIREBASE_APP_ID=ステップ1でメモした appId
```

**ステップ 3 — APIキーBにドメイン制限**
Google Cloud Console → 認証情報 → 新しく追加されたキーをクリック
- 「HTTP リファラー」で board の公開先ドメインを設定：
  ```
  https://board.yourapp.netlify.app/*
  ```

**ステップ 4 — App Check に登録しない（重要）**
`club-rivals-board` アプリは App Check に追加しないこと。
これにより Firebase Rules の `.write` 条件を満たせず、書き込みが常に拒否される。

---

## ⑤ ビルドとデプロイ

### メインアプリのビルド
```bash
npm run build
# → dist/ に出力
```

### /board ビルド
```bash
npm run build:board
# → dist/board/ に出力
```

### デプロイ例（Netlify）
- メインアプリ：`dist/` をデプロイ → `https://yourapp.netlify.app`
- /board：`dist/board/` を別サイトとしてデプロイ → `https://board.yourapp.netlify.app`
  - または同じサイトの `/board` パスにリダイレクト設定

---

## ⑥ 設定完了チェックリスト

```
□ Firebase Rules を ① の最終版に切り替えた（App Check 強制モード ON 後）
□ reCAPTCHA サイトキーを .env.local に設定した
□ Firebase Console で App Check を設定・強制モードを ON にした
□ APIキーA にドメイン制限を設定した
□ /board 専用アプリを Firebase に追加した（App Check には登録しない）
□ APIキーB（VITE_BOARD_FIREBASE_API_KEY）を .env.local に設定した
□ APIキーB にドメイン制限を設定した
□ npm run build と npm run build:board が両方正常に完了する
□ board ビルドで称号変更・アイコン変更・ランク申請ボタンが表示されない
□ board から Firebase へ書き込もうとすると Permission denied になる
```

---

## よくある質問

**Q. board ビルドでも個人ページは見られる？**
A. 見られます。PIN 認証 → 閲覧専用表示になります。称号・アイコン変更などのボタンは表示されません。

**Q. 開発中（localhost）で board ビルドをテストするには？**
A. `npm run build:board` 後、`npx serve dist/board` で確認できます。localhost からの書き込みは App Check がない状態なので Firebase Rules で拒否されます（開発中は Rules を一時的に緩めてください）。

**Q. メインアプリのAPIキーが漏れたら？**
A. App Check のドメイン制限があるため、登録ドメイン外では動作しません。万が一の場合は Google Cloud Console でキーを再生成してください。
