"use client";

import { useSyncExternalStore } from "react";

/**
 * 依存ライブラリを使わない最小限のハッシュルーター。
 * URL は `#/properties/detail?id=xxx` 形式。GitHub Pages でもサーバー設定不要で動く。
 *
 * Next.js の API（Link / useRouter / useSearchParams / usePathname）に
 * シグネチャを合わせ、各コンポーネントは import 元を変えるだけで動作する。
 */

function currentHash(): string {
  const h = window.location.hash.replace(/^#/, "");
  return h === "" ? "/" : h;
}

function subscribe(cb: () => void): () => void {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

/** 現在のハッシュ（"/path?query"）を購読する */
function useHash(): string {
  return useSyncExternalStore(
    subscribe,
    currentHash,
    () => "/",
  );
}

function splitHash(hash: string): { pathname: string; search: string } {
  const qi = hash.indexOf("?");
  return qi === -1
    ? { pathname: hash, search: "" }
    : { pathname: hash.slice(0, qi), search: hash.slice(qi + 1) };
}

export function navigate(to: string): void {
  window.location.hash = to.startsWith("/") ? to : `/${to}`;
  // 画面遷移時は先頭へスクロール
  window.scrollTo(0, 0);
}

export function usePathname(): string {
  return splitHash(useHash()).pathname;
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams(splitHash(useHash()).search);
}

export function useRouter(): { push: (to: string) => void } {
  return { push: navigate };
}

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function Link({ href, children, onClick, ...rest }: LinkProps) {
  return (
    <a
      href={`#${href.startsWith("/") ? href : `/${href}`}`}
      onClick={(e) => {
        onClick?.(e);
        window.scrollTo(0, 0);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
