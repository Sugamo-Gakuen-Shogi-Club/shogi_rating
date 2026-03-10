/**
 * index.board.tsx
 *
 * /board ビルド専用エントリーポイント。
 * PublicView だけをマウントする。
 * App / 管理画面 / 対戦記録ページなどは一切バンドルされない。
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import PublicView from './PublicView';
import { loadFromCloud } from './storage';

// 起動時にクラウドからデータを読み込む（書き込みは行わない）
loadFromCloud().catch(() => {/* board は読み取り専用のためエラーは無視 */});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('root 要素が見つかりません');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {/* readOnly=true → 称号・アイコン変更・ランク申請ボタンを非表示 */}
    <PublicView readOnly />
  </React.StrictMode>
);
