/**
 * 入力バリデーションのユーティリティ。
 * 数値・文字列・日付を明確に扱い、意図しない値を弾く。
 */

/** 数値文字列を厳密にパース。空文字・非数・無限大は null を返す。 */
export function parseNum(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/**
 * 入力中のサニタイズ。数字（および小数許可時のみ小数点）以外を除去する。
 * 負号・指数表記・複数の小数点は受け付けない。
 */
export function sanitizeNumberInput(s: string, opts?: { decimal?: boolean }): string {
  let v = s.replace(/[^\d.]/g, "");
  if (!opts?.decimal) {
    v = v.replace(/\./g, "");
  } else {
    const i = v.indexOf(".");
    if (i >= 0) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, "");
  }
  return v;
}

/** 妥当な日付文字列か */
export function isValidDate(s: string): boolean {
  if (!s) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

export interface NumberRule {
  /** 表示名（エラーメッセージ用） */
  label: string;
  min?: number;
  max?: number;
  /** 整数のみ許可 */
  integer?: boolean;
  /** 0 や空を許可するか（既定: 正の数が必須） */
  allowZero?: boolean;
  /** 未入力を許可するか（任意項目） */
  optional?: boolean;
}

/**
 * 数値を検証して返す。
 * 戻り値が string の場合はエラーメッセージ、number の場合は検証済みの値、
 * null は「任意かつ未入力」を表す。
 */
export function validateNumber(raw: string, rule: NumberRule): string | number | null {
  const t = raw.trim();
  if (t === "") {
    if (rule.optional) return null;
    return `${rule.label}を入力してください。`;
  }
  const n = Number(t);
  if (!Number.isFinite(n)) return `${rule.label}は数値で入力してください。`;
  if (rule.integer && !Number.isInteger(n))
    return `${rule.label}は整数で入力してください。`;
  if (!rule.allowZero && rule.min === undefined && n <= 0)
    return `${rule.label}は正の数で入力してください。`;
  if (rule.min !== undefined && n < rule.min)
    return `${rule.label}は${rule.min}以上で入力してください。`;
  if (rule.max !== undefined && n > rule.max)
    return `${rule.label}は${rule.max}以下で入力してください。`;
  return n;
}
