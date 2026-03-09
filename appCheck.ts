/**
 * appCheck.ts
 * Firebase App Check (reCAPTCHA v3) の初期化とトークン取得
 *
 * VITE_FIREBASE_API_KEY と VITE_RECAPTCHA_SITE_KEY を .env.local に設定すること。
 * 未設定の場合はApp Checkなしで動作する（開発環境向け）。
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  getToken,
  AppCheck,
} from 'firebase/app-check';

// ── Firebase 設定 ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID|| '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
};

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
const APP_CHECK_ENABLED  = !!RECAPTCHA_SITE_KEY;

let _app: FirebaseApp | null      = null;
let _appCheck: AppCheck | null    = null;
let _initialized                  = false;

/** 初期化（App.tsx の起動時に一度だけ呼ぶ） */
export const initAppCheck = (): void => {
  if (_initialized) return;
  _initialized = true;

  if (!APP_CHECK_ENABLED) {
    console.info('[AppCheck] VITE_RECAPTCHA_SITE_KEY が未設定のため App Check は無効です。');
    return;
  }

  try {
    // Firebase app の初期化（既に存在する場合は使い回す）
    _app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

    // 開発環境では debug token を使う
    if (import.meta.env.DEV) {
      // @ts-ignore
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    _appCheck = initializeAppCheck(_app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });

    console.info('[AppCheck] 初期化完了');
  } catch (e) {
    console.error('[AppCheck] 初期化失敗:', e);
  }
};

/**
 * App Check トークンを取得して返す。
 * App Check が無効 / 失敗時は null を返す（フォールバック動作）。
 */
export const getAppCheckToken = async (): Promise<string | null> => {
  if (!_appCheck) return null;
  try {
    const result = await getToken(_appCheck, /* forceRefresh */ false);
    return result.token;
  } catch (e) {
    console.warn('[AppCheck] トークン取得失敗:', e);
    return null;
  }
};
