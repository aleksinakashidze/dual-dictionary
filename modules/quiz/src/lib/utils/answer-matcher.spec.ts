import { isAnswerCorrect, normalizeAnswer } from './answer-matcher';

describe('answer-matcher', () => {
  describe('normalizeAnswer', () => {
    it('lowercases, trims and collapses whitespace', () => {
      expect(normalizeAnswer('  Home   House ')).toBe('home house');
    });

    it('strips leading/trailing punctuation and hyphens', () => {
      expect(normalizeAnswer('-გან')).toBe('გან');
      expect(normalizeAnswer('ცხადი.')).toBe('ცხადი');
    });
  });

  describe('isAnswerCorrect', () => {
    const visible = 'ხილვადი, ცხადი ◊ ცხადი';

    it('accepts a single alternative from a multi-variant translation', () => {
      expect(isAnswerCorrect(visible, 'ცხადი')).toBe(true);
      expect(isAnswerCorrect(visible, 'ხილვადი')).toBe(true);
    });

    it('accepts a whole ◊-group and the full string', () => {
      expect(isAnswerCorrect(visible, 'ხილვადი, ცხადი')).toBe(true);
      expect(isAnswerCorrect(visible, visible)).toBe(true);
    });

    it('is case and whitespace insensitive', () => {
      expect(isAnswerCorrect(visible, '  ЦХАДИ '.toLowerCase())).toBe(false);
      expect(isAnswerCorrect(visible, '  ცხადი  ')).toBe(true);
      expect(isAnswerCorrect('n home, house', 'HOUSE')).toBe(true);
    });

    it('splits on ◊ ; , and /', () => {
      const t = 'ანთება ◊ აალება ◊ ანთება, აალება; ცეცხლის წაკიდება';
      expect(isAnswerCorrect(t, 'ცეცხლის წაკიდება')).toBe(true);
      expect(isAnswerCorrect(t, 'აალება')).toBe(true);
      expect(isAnswerCorrect('big/large', 'large')).toBe(true);
    });

    it('ignores leading part-of-speech tags on English translations', () => {
      expect(isAnswerCorrect('n home, house', 'home')).toBe(true);
      expect(isAnswerCorrect('n home, house', 'n home')).toBe(true);
      expect(isAnswerCorrect('a indoor', 'indoor')).toBe(true);
      expect(isAnswerCorrect('adv quickly', 'quickly')).toBe(true);
    });

    it('does not accept the POS tag alone as an answer', () => {
      expect(isAnswerCorrect('n attics', 'attics')).toBe(true);
      expect(isAnswerCorrect('n attics', 'n')).toBe(false);
      expect(isAnswerCorrect('a indoor', 'a')).toBe(false);
    });

    it('accepts translations with or without parenthetical clarifications', () => {
      const t = 'ენა (მეტყველება) ◊ ენა';
      expect(isAnswerCorrect(t, 'ენა')).toBe(true);
      expect(isAnswerCorrect(t, 'ენა (მეტყველება)')).toBe(true);
    });

    it('accepts suffix translations with or without the leading hyphen', () => {
      const t = '-გან, დან ◊ დან';
      expect(isAnswerCorrect(t, 'გან')).toBe(true);
      expect(isAnswerCorrect(t, '-გან')).toBe(true);
      expect(isAnswerCorrect(t, 'დან')).toBe(true);
    });

    it('rejects wrong, partial and empty answers', () => {
      expect(isAnswerCorrect(visible, 'ხილვ')).toBe(false);
      expect(isAnswerCorrect(visible, 'ნათელი')).toBe(false);
      expect(isAnswerCorrect(visible, '')).toBe(false);
      expect(isAnswerCorrect(visible, '   ')).toBe(false);
      expect(isAnswerCorrect(visible, ',')).toBe(false);
    });
  });
});
