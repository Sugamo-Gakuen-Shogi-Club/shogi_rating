/**
 * firebase.ts
 *
 * Firebase App + App Check の初期化
 *
 * App Check を有効にするには:
 *   1. Firebase Console → App Check → アプリを登録
 *   2. reCAPTCHA v3 サイトキーを取得して下記 RECAPTCHA_SITE_KEY に設定
 *   3. Firebase Console → App Check → 「強制モード」を ON にする
 *
 * ローカル開発時は VITE_APP_CHECK_DEBUG_TOKEN を .env.local に設定:
 *   VITE_APP_CHECK_DEBUG_TOKEN=your-debug-token-here
 *   ※ デバッグトークンは Firebase Console → App Check → アプリ → デバッグトークンで発行
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck, getToken } from 'firebase/app-check';

// ── Firebase プロジェクト設定 ─────────────────────────────────
// Firebase Console → プロジェクトの設定 → マイアプリ → SDK の設定と構成
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       || 'https://club-rivals-test1-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID        || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET    || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID            || '',
};

// reCAPTCHA v3 サイトキー（Firebase Console → App Check で取得）
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

// ── App Check デバッグモード（ローカル開発用）───────────────────
// .env.local に VITE_APP_CHECK_DEBUG_TOKEN=xxx を設定すると自動で有効になる
if (import.meta.env.DEV && import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN) {
  // @ts-ignore
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN;
}

// ── Firebase App 初期化（二重初期化防止）────────────────────────
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// ── App Check 初期化 ─────────────────────────────────────────
let appCheck: AppCheck | null = null;

if (RECAPTCHA_SITE_KEY) {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    console.warn('[AppCheck] 初期化失敗（開発環境では正常）:', e);
  }
}

// ── App Check トークン取得（fetchに付与するため）──────────────
export const getAppCheckToken = async (): Promise<string | null> => {
  if (!appCheck) return null;
  try {
    const result = await getToken(appCheck, /* forceRefresh */ false);
    return result.token;
  } catch (e) {
    console.warn('[AppCheck] トークン取得失敗:', e);
    return null;
  }
};

export { app };
