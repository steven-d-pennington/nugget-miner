import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve('src/app/globals.css'), 'utf8');

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

const themes = [
  {
    name: 'dark',
    tokens: readBlock(/:root\s*\{([\s\S]*?)\}/, 'dark'),
  },
  {
    name: 'light',
    tokens: readBlock(/@media\s*\(prefers-color-scheme:\s*light\)\s*\{\s*:root\s*\{([\s\S]*?)\}/, 'light'),
  },
];

describe.each(themes)('$name theme accent contrast', ({ tokens }) => {
  it('meets WCAG AA for normal text', () => {
    const accent = readHexToken(tokens, '--accent');
    const foreground = readHexToken(tokens, '--accent-foreground');

    expect(contrastRatio(foreground, accent)).toBeGreaterThanOrEqual(4.5);
  });
});
