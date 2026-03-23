/**
 * firebase.ts
 *
 * Firebase App + App Check + Google Authentication の初期化
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider, AppCheck, getToken } from 'firebase/app-check';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut,
  onAuthStateChanged, Auth, User as FirebaseUser,
} from 'firebase/auth';

// ── Firebase プロジェクト設定 ─────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       || 'https://club-rivals-test1-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
};

// ── App Check デバッグモード（ローカル開発用）─────────────────
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
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

// ── App Check トークン取得 ────────────────────────────────────
export const getAppCheckToken = async (): Promise<string | null> => {
  if (!appCheck) return null;
  try {
    const result = await getToken(appCheck, false);
    return result.token;
  } catch (e) {
    console.warn('[AppCheck] トークン取得失敗:', e);
    return null;
  }
};

// ── Google Authentication ─────────────────────────────────────
export const auth: Auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ hd: 'sugamo.ed.jp' });

/** Googleログイン（ポップアップ） */
export const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const email = result.user.email ?? '';
    if (!email.endsWith('@sugamo.ed.jp')) {
      await signOut(auth);
      return null;
    }
    return result.user;
  } catch (e) {
    console.error('[Auth] Googleログイン失敗:', e);
    return null;
  }
};

/** ログアウト */
export const signOutGoogle = () => signOut(auth);

/**
 * メールアドレスから学籍番号部分を取得
 * 例: 125010@sugamo.ed.jp → '125010'
 */
export const getStudentIdFromEmail = (email: string): string =>
  email.split('@')[0];

/**
 * プロフィールアクセス権の判定
 * ADMIN  : igoshogi@sugamo.ed.jp → 全員閲覧・編集可
 * OWNER  : 本人（studentId一致） → 自分のみ編集可
 * VIEWER : その他のsugamo.ed.jp  → 閲覧のみ
 * DENIED : 上記以外              → アクセス不可
 */
export type ProfileAccess = 'ADMIN' | 'OWNER' | 'VIEWER' | 'DENIED';
export const getProfileAccess = (
  firebaseUser: FirebaseUser | null,
  targetStudentId: string | undefined,
): ProfileAccess => {
  if (!firebaseUser) return 'DENIED';
  const email = firebaseUser.email ?? '';
  if (!email.endsWith('@sugamo.ed.jp')) return 'DENIED';
  if (email === 'igoshogi@sugamo.ed.jp') return 'ADMIN';
  const myStudentId = getStudentIdFromEmail(email);
  if (targetStudentId && myStudentId === targetStudentId) return 'OWNER';
  return 'VIEWER';
};

/** Auth状態変化を監視 */
export const onAuthChanged = (cb: (user: FirebaseUser | null) => void) =>
  onAuthStateChanged(auth, cb);

export { app };
