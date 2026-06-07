/**
 * 住所文字列から都道府県・市区町村を簡易的に抽出するユーティリティ。
 * 一般的な日本の住所表記を前提とした概算パース（厳密な住所正規化ではない）。
 */

const UNKNOWN_PREF = "住所未設定";
const UNKNOWN_CITY = "市区町村未設定";

/** 都道府県を抽出する（北海道 / 東京都 / 大阪府・京都府 / 〜県） */
export function parsePrefecture(address: string): string {
  const m = address.match(/^(北海道|東京都|(?:京都|大阪)府|.{2,3}?県)/);
  return m ? m[1] : UNKNOWN_PREF;
}

/**
 * 市区町村を抽出する。
 * - 政令指定都市は「◯◯市△△区」までを 1 単位とする
 * - 郡部は「◯◯郡△△町（村）」までを 1 単位とする
 * - それ以外は最初の 市 / 区 / 町 / 村 まで
 */
export function parseCity(address: string): string {
  const pref = parsePrefecture(address);
  const rest = pref === UNKNOWN_PREF ? address : address.slice(pref.length);
  if (!rest) return UNKNOWN_CITY;
  const m = rest.match(/^(.+?郡.+?[町村]|.+?市.+?区|.+?[市区町村])/);
  return m ? m[1] : UNKNOWN_CITY;
}

/** 都道府県・市区町村をまとめて返す */
export function splitAddress(address: string): { prefecture: string; city: string } {
  const trimmed = (address ?? "").trim();
  if (!trimmed) return { prefecture: UNKNOWN_PREF, city: UNKNOWN_CITY };
  return { prefecture: parsePrefecture(trimmed), city: parseCity(trimmed) };
}
