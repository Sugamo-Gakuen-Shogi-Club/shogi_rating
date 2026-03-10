/**
 * firebase.board.ts
 *
 * /board ビルド専用の Firebase 初期化ファイル。
 *
 * ● App Check を初期化しない
 *     → Firebase Rules が "request.appCheck.token.sub != null" を
 *       要求するため、このキーでは物理的に書き込めない。
 *
 * ● 別の API キーを使う（VITE_BOARD_FIREBASE_API_KEY）
 *     → Google Cloud Console でこのキーに「読み取り専用」のドメイン制限をかける。
 *
 * vite.config.board.ts が import './firebase' を
 * import './firebase.board' に自動でエイリアスする。
 * PublicView / storage.ts は変更不要。
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  // Board 専用 API キー（Google Cloud Console で別途作成・制限する）
  apiKey:            import.meta.env.VITE_BOARD_FIREBASE_API_KEY       || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         || '',
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL        || 'https://club-rivals-test1-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_BOARD_FIREBASE_APP_ID        || '',
};

// ── Firebase App 初期化（二重初期化防止） ──────────────────────
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// ── App Check は初期化しない ───────────────────────────────────
// getAppCheckToken() は storage.ts が呼ぶ。board では常に null を返す。
// → Firebase Rules の .write 条件を満たせず書き込みは全拒否される。
export const getAppCheckToken = async (): Promise<string | null> => null;

export { app };
