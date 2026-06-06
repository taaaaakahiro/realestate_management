import type { NextConfig } from "next";

/**
 * GitHub Pages（静的ホスティング）向け設定。
 * - output: "export" で静的HTMLに書き出す
 * - リポジトリ名のサブパスで配信されるため basePath を付与
 */
const repo = "realestate_management";
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? `/${repo}` : "",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
