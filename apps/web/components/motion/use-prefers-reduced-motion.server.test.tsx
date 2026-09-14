/** @jest-environment node */
import { renderToString } from 'react-dom/server';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

it('renders a deterministic server snapshot without a browser', () => {
  expect(typeof window).toBe('undefined');
  function Probe() { return <span>{String(usePrefersReducedMotion())}</span>; }
  expect(renderToString(<Probe />)).toBe('<span>false</span>');
});
