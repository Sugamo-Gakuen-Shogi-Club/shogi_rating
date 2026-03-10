/**
 * vite.config.board.ts
 *
 * /board 専用ビルド設定。
 * `npm run build:board` で実行される。
 *
 * 主な差分（メインビルドとの違い）:
 *   ① エントリーポイント → index.board.html
 *   ② firebase のエイリアス → firebase.board.ts（App Check なし）
 *   ③ 出力ディレクトリ → dist/board
 *   ④ define で VITE_IS_BOARD = 'true' を注入
 *      → PublicView が readOnly モードで動作する
 */

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // board 専用 HTML をエントリーポイントに
    root: '.',
    build: {
      outDir: 'dist/board',
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve('.', 'index.board.html'),
      },
    },
    plugins: [react()],
    define: {
      // PublicView が readOnly かどうかを判定するフラグ
      'import.meta.env.VITE_IS_BOARD': JSON.stringify('true'),
    },
    resolve: {
      alias: {
        '@': path.resolve('.'),
        // ★ core差し替え: firebase → firebase.board
        //    これにより storage.ts / PublicView が
        //    App Check なしの Firebase を使うようになる
        './firebase': path.resolve('.', 'firebase.board.ts'),
      },
    },
  };
});
