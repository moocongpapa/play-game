import assert from 'node:assert/strict';
import test from 'node:test';
import { createNumberSpeaker, englishNumberWord, nextPlayNumber, numberWord, type NumberRequest } from './numberPlay';

test('0–100 counting speaks complete Korean forms including irregular native tens', () => {
  const cases = [
    [0, '영', '영'], [1, '하나', '일'], [2, '둘', '이'], [3, '셋', '삼'], [4, '넷', '사'],
    [10, '열', '십'], [11, '열하나', '십일'], [20, '스물', '이십'], [21, '스물하나', '이십일'],
    [30, '서른', '삼십'], [40, '마흔', '사십'], [50, '쉰', '오십'], [60, '예순', '육십'],
    [70, '일흔', '칠십'], [80, '여든', '팔십'], [90, '아흔', '구십'], [99, '아흔아홉', '구십구'], [100, '백', '백'],
  ] as const;
  for (const [value, native, sino] of cases) {
    assert.equal(numberWord(value, 'native'), native);
    assert.equal(numberWord(value, 'sino'), sino);
  }
  assert.equal(nextPlayNumber(-1), 0);
  let n = -1;
  const cycle = Array.from({ length: 102 }, () => n = nextPlayNumber(n));
  assert.deepEqual(cycle, [...Array.from({ length: 101 }, (_, i) => i), 0]);
  for (let value = 0; value <= 100; value++) {
    assert.ok(numberWord(value, 'native'));
    assert.ok(numberWord(value, 'sino'));
    assert.match(englishNumberWord(value), /^[a-z ]+$/);
  }
  for (const value of [-1, 101, 1.5, NaN]) assert.throws(() => numberWord(value, 'native'), RangeError);
  assert.equal(englishNumberWord(18), 'eighteen');
  assert.equal(englishNumberWord(40), 'forty');
  assert.equal(englishNumberWord(81), 'eighty one');
  assert.equal(englishNumberWord(100), 'one hundred');
});

test('rapid taps keep the first voice then coalesce to the latest number and reading', () => {
  const calls: Array<{ request: NumberRequest; callbacks: { onEnd: () => void; onError: () => void; onCancel: () => void } }> = [];
  const speaker = createNumberSpeaker((request, callbacks) => calls.push({ request, callbacks }));
  speaker.push({ value: 1, mode: 'native' });
  speaker.push({ value: 1, mode: 'native' });
  assert.equal(calls.length, 1);
  for (let value = 2; value < 100; value++) speaker.push({ value, mode: 'sino' });
  assert.equal(calls.length, 1);
  calls[0].callbacks.onEnd();
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1].request, { value: 99, mode: 'sino' });
  calls[0].callbacks.onEnd();
  assert.equal(calls.length, 2);
  speaker.push({ value: 100, mode: 'native' });
  speaker.clear(); // mute, parent pause or leaving this screen
  calls[1].callbacks.onEnd();
  assert.equal(calls.length, 2);
  speaker.push({ value: 0, mode: 'native' });
  speaker.push({ value: 1, mode: 'sino' });
  calls[2].callbacks.onCancel();
  calls[2].callbacks.onEnd();
  assert.equal(calls.length, 3);
  speaker.push({ value: 2, mode: 'sino' });
  speaker.push({ value: 3, mode: 'native' });
  calls[3].callbacks.onError();
  assert.deepEqual(calls[4].request, { value: 3, mode: 'native' });
});
