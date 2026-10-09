export type NumberReading = 'native' | 'sino';
export interface NumberRequest { value: number; mode: NumberReading }

const NATIVE_ONES = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
const NATIVE_TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];
const SINO_ONES = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const ENGLISH_SMALL = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const ENGLISH_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function validNumber(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 100) throw new RangeError('Expected a whole number from 0 to 100');
}
export function nextPlayNumber(value: number) { return (value + 1) % 101; }
export function numberWord(value: number, mode: NumberReading): string {
  validNumber(value);
  // Zero has no native counting form; "영" and "백" are familiar in both tracks.
  if (value === 0) return '영';
  if (value === 100) return '백';
  const tens = Math.floor(value / 10), ones = value % 10;
  return mode === 'native' ? NATIVE_TENS[tens] + NATIVE_ONES[ones]
    : (tens ? (tens === 1 ? '' : SINO_ONES[tens]) + '십' : '') + SINO_ONES[ones];
}
export function englishNumberWord(value: number): string {
  validNumber(value);
  if (value === 100) return 'one hundred';
  if (value < 20) return ENGLISH_SMALL[value];
  return ENGLISH_TENS[Math.floor(value / 10)] + (value % 10 ? ` ${ENGLISH_SMALL[value % 10]}` : '');
}

/** Never build a long speech backlog: finish the current number, then read the
 * latest tap. Invalidating on mute, pause or exit also rejects late callbacks. */
export function createNumberSpeaker(speak: (request: NumberRequest, callbacks: { onEnd: () => void; onError: () => void; onCancel: () => void }) => void) {
  let generation = 0;
  let active: number | null = null;
  let current: NumberRequest | null = null;
  let pending: NumberRequest | null = null;
  const clear = () => { generation++; active = null; current = null; pending = null; };
  const play = () => {
    if (active !== null || !pending) return;
    const request = pending;
    pending = null;
    const token = ++generation;
    active = token;
    current = request;
    const finish = () => { if (active !== token) return; active = null; current = null; play(); };
    speak(request, { onEnd: finish, onError: finish, onCancel: () => { if (active === token) clear(); } });
  };
  return {
    push(request: NumberRequest) {
      validNumber(request.value);
      // Replaying the number already being read keeps its first voice only.
      if (current?.value === request.value && numberWord(current.value, current.mode) === numberWord(request.value, request.mode)) { pending = null; return; }
      pending = request;
      play();
    },
    clear,
  };
}
