const GEORGIAN_RE = /[\u10A0-\u10FF]/;
const UTF8_MOJIBAKE_RE = /[\u0080-\u009F\u00C0-\u00FF]/;

export function decodePossibleUtf8Mojibake(value: string): string {
  if (!value || GEORGIAN_RE.test(value) || !UTF8_MOJIBAKE_RE.test(value)) {
    return value;
  }

  const decoded = Buffer.from(value, 'latin1').toString('utf8');
  return GEORGIAN_RE.test(decoded) ? decoded : value;
}
