import assert from 'node:assert/strict';
import test from 'node:test';
import { createGameFrameClock, fallingItemPosition, isFallingItemCaught } from './gameFrameClock';

test('physics freezes throughout parent/background pause without a catch-up jump', () => {
  const clock = createGameFrameClock();
  clock.step(0);
  const moving = clock.step(1000 / 60);
  assert.ok(Math.abs(moving.frames - 1) < .001);
  assert.equal(clock.step(500, true).elapsedMs, moving.elapsedMs);
  assert.equal(clock.step(60_000, true).frames, 0);
  assert.equal(clock.step(60_016).frames, 0, 'first resumed frame anchors time without advancing');
  assert.ok(Math.abs(clock.step(60_032).frames - .96) < .001);

  // A hidden tab may receive no RAF callbacks at all. Visibility resets its anchor.
  clock.resetFrame();
  assert.equal(clock.step(180_000).frames, 0);
  assert.ok(clock.step(181_000).deltaMs <= 50, 'a dropped frame cannot fling an object off screen');
});

test('falling artwork and its catch target use the same responsive coordinate space', () => {
  for (const [width, height] of [[320, 480], [820, 1080], [1440, 800]]) {
    const basket = fallingItemPosition(62, 82, width, height);
    const fruit = fallingItemPosition(62, 82, width, height);
    assert.deepEqual(fruit, basket);
    const target = { x: 62, y: 82, width: 100 };
    assert.equal(isFallingItemCaught({ x: 62, y: 82, size: 48 }, target, { width, height }), true);
    const tolerantX = 62 + 75 / width * 100;
    assert.equal(isFallingItemCaught({ x: tolerantX, y: 82, size: 48 }, target, { width, height }), true, 'nearby fruit edges fit into the forgiving visible basket');
    const outsideX = 62 + 100 / width * 100;
    assert.equal(isFallingItemCaught({ x: outsideX, y: 82, size: 48 }, target, { width, height }), false, 'a visibly separate fruit cannot be caught');
    assert.equal(isFallingItemCaught({ x: 62, y: 50, size: 48 }, target, { width, height }), false);
    const nextFrame = fallingItemPosition(62, 82.5, width, height);
    assert.equal(nextFrame.x, fruit.x);
    assert.ok(nextFrame.y > fruit.y, 'one physics step has an immediately visible lower center');
  }
});
