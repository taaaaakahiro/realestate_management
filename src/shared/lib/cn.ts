/** className を条件付きで結合する軽量ヘルパー */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
