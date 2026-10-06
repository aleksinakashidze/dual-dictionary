/**
 * Dictionary translations are stored as a single string that packs several
 * alternatives together, e.g.:
 *   "ხილვადი, ცხადი ◊ ცხადი"
 *   "ანთება ◊ აალება ◊ ანთება, აალება; ცეცხლის წაკიდება"
 *   "n home, house"          (en-ka source side carries a POS tag)
 *   "ენა (მეტყველება) ◊ ენა"
 *
 * A quiz answer is correct when it matches the whole string or any single
 * alternative after normalization.
 */

/** Separators between alternative translations, in order of granularity. */
const VARIANT_SEPARATOR = /[◊;,/]/;

/** Leading part-of-speech tags used in the English side of the dictionary. */
const POS_TAG =
  /^(n|v|a|adj|adv|prep|pron|conj|interj|num|art|part)\.?\s+(?=\S)/i;

const PARENTHETICAL = /\s*\([^)]*\)\s*/g;

export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–—.!?:]+|[\s\-–—.!?:]+$/g, '')
    .trim();
}

/** Expands a stored translation into every form that should be accepted. */
export function getAcceptedAnswers(translation: string): Set<string> {
  const accepted = new Set<string>();

  const add = (raw: string): void => {
    const normalized = normalizeAnswer(raw);
    if (normalized) accepted.add(normalized);
  };

  const addWithDerivatives = (raw: string): void => {
    add(raw);
    add(raw.replace(POS_TAG, ''));
    const withoutParens = raw.replace(PARENTHETICAL, ' ');
    add(withoutParens);
    add(withoutParens.replace(POS_TAG, ''));
  };

  addWithDerivatives(translation);

  // "a ◊ b, c" → also accept the ◊-level groups ("b, c") and every atom.
  for (const group of translation.split('◊')) {
    addWithDerivatives(group);
    for (const atom of group.split(VARIANT_SEPARATOR)) {
      addWithDerivatives(atom);
    }
  }

  return accepted;
}

export function isAnswerCorrect(translation: string, answer: string): boolean {
  const normalizedAnswer = normalizeAnswer(answer);
  if (!normalizedAnswer) return false;
  return getAcceptedAnswers(translation).has(normalizedAnswer);
}
