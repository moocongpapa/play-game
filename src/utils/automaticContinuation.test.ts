import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RoundContinuation } from '../components/RoundContinuation';
import { DayContinuationContext, PlayHintsPausedContext } from '../components/PlayFlowContext';

test('completed rounds never add a visible next button, including Friend Day and paused screens', () => {
  for (const day of [null, { onNext() {} }]) {
    for (const paused of [false, true]) {
      const html = renderToStaticMarkup(createElement(DayContinuationContext.Provider, { value: day },
        createElement(PlayHintsPausedContext.Provider, { value: paused },
          createElement(RoundContinuation, { onNext() {}, label: '곧 이어져요' }))));
      assert.doesNotMatch(html, /<button|round-continuation|day-next/);
      assert.match(html, /class="sr-only" role="status"/);
      assert.match(html, /곧 이어져요/);
    }
  }
});
