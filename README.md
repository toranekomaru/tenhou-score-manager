# 雀魂成績管理 (Mahjong Tracker)

このプロジェクトは、Vite + React + TypeScriptを利用したローカル完結（IndexedDB）型のオンライン麻雀（雀魂対応）成績管理Webアプリです。ユーザーのリクエストに基づきAIが自動生成しました。

## 技術スタック
- React 18, TypeScript, Vite
- Tailwind CSS
- Recharts (グラフ描画)
- Dexie.js (IndexedDBラッパー)
- lucide-react (アイコン)

## インストール手順

まずこのディレクトリ（`c:\Users\2013t\.gemini\antigravity\playground\sparse-cosmic` またはコピー先）で、依存パッケージをインストールします。

```bash
# npmを用いる場合
npm install

# yarnを用いる場合
yarn install
```

## 起動手順

依存関係のインストール後、以下のコマンドでViteのDevサーバーを起動してください。

```bash
npm run dev
# または yarn dev
```

起動後、コンソールに表示されるURL（例: `http://localhost:5173`）をブラウザで開くことで、本アプリをご利用いただけます。

## 特徴と使い方
- **完全ローカル保存**: すべてのデータはブラウザのIndexedDBに保存され、通信は発生しません。
- **洗練されたUI**: TailwindCSSを用いたモダンなダッシュボードスタイルを採用しています。
- **設定画面**: はじめに現在の段位とポイントを「設定」タブから登録してください。
- **自動段位計算**: 各対局の順位・点数を入力すると、ルール（玉の間/王座の間など）に合わせた専用の計算式でポイントと段位の推移を自動計算します。
