/** A game's clock advances only while it is visible and available to the child. */
export function createGameFrameClock(maxStepMs = 50) {
  let previousTime: number | null = null;
  let elapsedMs = 0;

  return {
    step(now: number, paused = false) {
      if (paused) {
        previousTime = null;
        return { deltaMs: 0, frames: 0, elapsedMs };
      }
      const deltaMs = previousTime === null ? 0 : Math.min(maxStepMs, Math.max(0, now - previousTime));
      previousTime = now;
      elapsedMs += deltaMs;
      return { deltaMs, frames: deltaMs / (1000 / 60), elapsedMs };
    },
    // Called on a visibility/parent pause change even if the browser suspended RAF.
    resetFrame() { previousTime = null; },
  };
}

/** The same center is used by both the visible transform and catch detection. */
export function fallingItemPosition(xPercent: number, yPercent: number, width: number, height: number) {
  return { x: width * xPercent / 100, y: height * yPercent / 100 };
}

export function isFallingItemCaught(
  item: { x: number; y: number; size: number },
  basket: { x: number; y: number; width: number },
  stage: { width: number; height: number },
) {
  const fruitCenter = fallingItemPosition(item.x, item.y, stage.width, stage.height);
  const basketCenter = fallingItemPosition(basket.x, basket.y, stage.width, stage.height);
  return Math.abs(fruitCenter.x - basketCenter.x) <= basket.width / 2 + item.size / 2 + 8
    && Math.abs(fruitCenter.y - basketCenter.y) <= stage.height * .06;
}
