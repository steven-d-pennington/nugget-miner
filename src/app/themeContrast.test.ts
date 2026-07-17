import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve('src/app/globals.css'), 'utf8');
const layout = readFileSync(resolve('src/app/layout.tsx'), 'utf8');

function readBlock(pattern: RegExp, label: string) {
  const match = css.match(pattern);
  if (!match?.[1]) throw new Error(`Could not read the ${label} theme tokens from globals.css.`);
  return match[1];
}

function readHexToken(block: string, token: string) {
  const match = block.match(new RegExp(`${token}:\\s*(#[0-9a-f]{6})`, 'i'));
  if (!match?.[1]) throw new Error(`Could not read ${token} from globals.css.`);
  return match[1];
}

function channelLuminance(channel: number) {
  const normalized = channel / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string) {
  const channels = hex.slice(1).match(/.{2}/g)?.map((channel) => Number.parseInt(channel, 16));
  if (!channels || channels.length !== 3) throw new Error(`Invalid color token: ${hex}`);
  const [red = 0, green = 0, blue = 0] = channels.map(channelLuminance);
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

const tokens = readBlock(/:root\s*\{([\s\S]*?)\}/, 'approved light');

describe('approved light theme accent contrast', () => {
  it('meets WCAG AA for normal text and amber controls', () => {
    const accent = readHexToken(tokens, '--accent');
    const canvas = readHexToken(tokens, '--canvas');
    const ink = readHexToken(tokens, '--ink');
    const muted = readHexToken(tokens, '--muted');

    expect(contrastRatio(ink, accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(ink, canvas)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(muted, canvas)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('mobile shell viewport contract', () => {
  it('keeps navigation fixed and reserves its safe-area-aware height in content', () => {
    const navigation = readBlock(/\.bottom-nav\s*\{([\s\S]*?)\}/, 'bottom navigation');
    const main = readBlock(/\.app-shell__main\s*\{([\s\S]*?)\}/, 'application main');

    expect(navigation).toMatch(/position:\s*fixed/);
    expect(navigation).toMatch(/right:\s*0/);
    expect(navigation).toMatch(/bottom:\s*0/);
    expect(navigation).toMatch(/left:\s*0/);
    expect(navigation).toContain('env(safe-area-inset-bottom');
    expect(main).toContain('var(--bottom-nav-height)');
    expect(main).toContain('env(safe-area-inset-bottom');
  });

  it('covers the viewport and respects horizontal device safe areas', () => {
    const header = readBlock(/\.app-shell__header-inner\s*\{([\s\S]*?)\}/, 'application header');
    const main = readBlock(/\.app-shell__main\s*\{([\s\S]*?)\}/, 'application main');
    const navigationList = readBlock(/\.bottom-nav__list\s*\{([\s\S]*?)\}/, 'bottom navigation list');

    for (const block of [header, main, navigationList]) {
      expect(block).toContain('env(safe-area-inset-left');
      expect(block).toContain('env(safe-area-inset-right');
    }
    expect(layout).toMatch(/viewportFit:\s*['"]cover['"]/);
  });
});
