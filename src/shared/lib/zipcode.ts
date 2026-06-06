/**
 * 郵便番号 → 住所（都道府県＋市区町村＋町域）の検索。
 * 外部API（zipcloud）への依存をここに隔離する。差し替え時はこのファイルのみ変更すればよい。
 */

export interface ZipLookupResult {
  /** 住所（番地・建物名を除いた途中まで） */
  address: string;
}

export interface ZipLookupError {
  error: string;
}

/** 全角・ハイフン等を除去して7桁の数字を取り出す */
export function normalizeZip(input: string): string {
  return input.replace(/[^0-9]/g, "").slice(0, 7);
}

export async function lookupAddressByZip(
  rawCode: string,
): Promise<ZipLookupResult | ZipLookupError> {
  const code = normalizeZip(rawCode);
  if (code.length !== 7) {
    return { error: "郵便番号は7桁の数字で入力してください。" };
  }

  try {
    const res = await fetch(
      `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${code}`,
      { cache: "no-store" },
    );
    if (!res.ok) return { error: "住所の取得に失敗しました。" };

    const data = (await res.json()) as {
      results: { address1: string; address2: string; address3: string }[] | null;
    };
    const r = data.results?.[0];
    if (!r) return { error: "該当する住所が見つかりませんでした。" };

    return { address: `${r.address1}${r.address2}${r.address3}` };
  } catch {
    return { error: "住所の取得に失敗しました。" };
  }
}
