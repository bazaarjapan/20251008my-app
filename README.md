This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

このリポジトリは Vercel の Git 連携で自動 CI/CD デプロイできるよう構成しています。`vercel.json` がビルドコマンド (`npm run build`) と出力先 (`.vercel/output`) を定義し、環境変数 `ADMIN_TOKEN` を Vercel シークレット `@admin-token` として参照します。

1. GitHub / GitLab / Bitbucket 上のリポジトリを Vercel の「New Project」からインポートします。
2. Vercel CLI でシークレットを登録するか、ダッシュボードの「Environment Variables」で `ADMIN_TOKEN` を追加します。CLI 例: `vercel secrets add admin-token <your-secret>`.
3. Production / Preview / Development すべてに同じシークレットを割り当て、必要なら追加の環境変数も設定します。
4. main ブランチへ push すると自動でビルド・デプロイが走り、Pull Request の場合はプレビュー URL が発行されます。

詳細は [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) および [Vercel Git Integration](https://vercel.com/docs/deployments/git#git-integration) を参照してください。
