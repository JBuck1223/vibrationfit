#!/usr/bin/env node
/**
 * Generates individual transparent-background PNG overlay assets
 * for Premiere Pro video production of the Activation Intensive videos.
 *
 * Usage: node scripts/generate-intensive-overlays.mjs
 *
 * Output: scripts/intensive-overlays/<category>/<asset>.png
 */

import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'intensive-overlays');

// ═══════════════════════════════════════════════════════════════
// BRAND TOKENS (from src/lib/design-system/tokens.ts)
// ═══════════════════════════════════════════════════════════════

const C = {
  primary:   '#39FF14',
  secondary: '#00FFFF',
  accent:    '#BF00FF',
  energy:    '#FFFF00',
  contrast:  '#FF0040',
  pink:      '#FF0080',
  orange:    '#FF6600',
  white:     '#FFFFFF',
  light:     '#CCCCCC',
  gray:      '#999999',
  dim:       '#666666',
  border:    '#333333',
  card:      '#1F1F1F',
  dark:      '#111827',
  black:     '#0A0A0A',
};

const FONT = 'Poppins, Helvetica Neue, Helvetica, Arial, sans-serif';

// ═══════════════════════════════════════════════════════════════
// SVG HELPERS
// ═══════════════════════════════════════════════════════════════

function svgDoc(w, h, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
  ${glowFilter('glow-green',  C.primary,   8)}
  ${glowFilter('glow-cyan',   C.secondary, 8)}
  ${glowFilter('glow-purple', C.accent,    8)}
  ${glowFilter('glow-yellow', C.energy,    8)}
  ${glowFilter('glow-red',    C.contrast,  8)}
  ${glowFilter('glow-pink',   C.pink,      8)}
  ${glowFilter('glow-white',  C.white,     6)}
  ${glowFilter('glow-green-lg',  C.primary,   16)}
  ${glowFilter('glow-cyan-lg',   C.secondary, 16)}
  ${glowFilter('glow-purple-lg', C.accent,    16)}
</defs>
${content}
</svg>`;
}

function glowFilter(id, color, blur) {
  return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;
}

function glowFilterId(color) {
  const map = {
    [C.primary]:   'glow-green',
    [C.secondary]: 'glow-cyan',
    [C.accent]:    'glow-purple',
    [C.energy]:    'glow-yellow',
    [C.contrast]:  'glow-red',
    [C.pink]:      'glow-pink',
    [C.white]:     'glow-white',
  };
  return map[color] || 'glow-green';
}

function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function text(str, x, y, size, color, opts = {}) {
  const {
    weight = '700',
    anchor = 'middle',
    glow = false,
    glowColor = null,
    opacity = 1,
    letterSpacing = 0,
    transform = '',
  } = opts;
  const filterId = glow ? glowFilterId(glowColor || color) : null;
  const filterAttr = filterId ? ` filter="url(#${filterId})"` : '';
  const lsAttr = letterSpacing ? ` letter-spacing="${letterSpacing}"` : '';
  const tAttr = transform ? ` transform="${transform}"` : '';
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" opacity="${opacity}"${filterAttr}${lsAttr}${tAttr}>${esc(str)}</text>`;
}

function roundedRect(x, y, w, h, r, fill, stroke = null, strokeW = 2) {
  const sAttr = stroke ? ` stroke="${stroke}" stroke-width="${strokeW}"` : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}"${sAttr}/>`;
}

function circle(cx, cy, r, fill, stroke = null, strokeW = 2) {
  const sAttr = stroke ? ` stroke="${stroke}" stroke-width="${strokeW}"` : '';
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${sAttr}/>`;
}

function line(x1, y1, x2, y2, color, width = 2) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
}

function arrow(x1, y1, x2, y2, color, width = 3) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 12;
  const ax = x2 - headLen * Math.cos(angle - Math.PI / 6);
  const ay = y2 - headLen * Math.sin(angle - Math.PI / 6);
  const bx = x2 - headLen * Math.cos(angle + Math.PI / 6);
  const by = y2 - headLen * Math.sin(angle + Math.PI / 6);
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>
  <polygon points="${x2},${y2} ${ax},${ay} ${bx},${by}" fill="${color}"/>`;
}

// ═══════════════════════════════════════════════════════════════
// REUSABLE ASSET GENERATORS
// ═══════════════════════════════════════════════════════════════

function titleAsset(label, color, size = 72) {
  const w = Math.max(800, label.length * size * 0.55);
  const h = size + 80;
  const content = text(label, w / 2, h / 2 + size * 0.35, size, color, { weight: '700', glow: true });
  return { svg: svgDoc(w, h, content), w, h };
}

function subtitleAsset(label, color, size = 40) {
  const w = Math.max(600, label.length * size * 0.5);
  const h = size + 60;
  const content = text(label, w / 2, h / 2 + size * 0.35, size, color, { weight: '500', glow: true });
  return { svg: svgDoc(w, h, content), w, h };
}

function stepBadgeAsset(num, color) {
  const s = 200;
  const content = [
    circle(s / 2, s / 2, 70, 'none', color, 4),
    `<circle cx="${s / 2}" cy="${s / 2}" r="70" fill="${color}" opacity="0.15"/>`,
    text(String(num), s / 2, s / 2 + 18, 52, color, { weight: '700', glow: true }),
  ].join('\n');
  return { svg: svgDoc(s, s, content), w: s, h: s };
}

function phaseLabelAsset(label, color) {
  const w = Math.max(400, label.length * 28 + 80);
  const h = 80;
  const content = [
    roundedRect(4, 4, w - 8, h - 8, 40, 'none', color, 3),
    `<rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="40" ry="40" fill="${color}" opacity="0.1"/>`,
    text(label.toUpperCase(), w / 2, h / 2 + 10, 28, color, { weight: '600', letterSpacing: 3, glow: true }),
  ].join('\n');
  return { svg: svgDoc(w, h, content), w, h };
}

function categoryTileAsset(label, color) {
  const w = 320;
  const h = 120;
  const content = [
    roundedRect(4, 4, w - 8, h - 8, 16, C.card, color, 2.5),
    text(label.toUpperCase(), w / 2, h / 2 + 10, 26, color, { weight: '600', letterSpacing: 2, glow: true }),
  ].join('\n');
  return { svg: svgDoc(w, h, content), w, h };
}

function featureCardAsset(title, subtitle, color) {
  const w = 700;
  const h = 180;
  const content = [
    roundedRect(4, 4, w - 8, h - 8, 20, C.card, color, 2.5),
    `<rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="20" ry="20" fill="${color}" opacity="0.08"/>`,
    text(title, w / 2, 75, 32, C.white, { weight: '700' }),
    text(subtitle, w / 2, 118, 20, C.light, { weight: '400' }),
  ].join('\n');
  return { svg: svgDoc(w, h, content), w, h };
}

function numberedCardAsset(num, title, subtitle, color) {
  const w = 700;
  const h = 160;
  const numW = 60;
  const content = [
    roundedRect(4, 4, w - 8, h - 8, 20, C.card, color, 2.5),
    `<rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="20" ry="20" fill="${color}" opacity="0.08"/>`,
    circle(60, h / 2, 24, color + '33', color, 2),
    text(String(num), 60, h / 2 + 10, 26, color, { weight: '700' }),
    text(title, 105 + (w - 105) / 2, 68, 28, C.white, { weight: '700' }),
    text(subtitle, 105 + (w - 105) / 2, 108, 18, C.light, { weight: '400' }),
  ].join('\n');
  return { svg: svgDoc(w, h, content), w, h };
}

function labelAsset(label, color, size = 30) {
  const w = Math.max(300, label.length * size * 0.55 + 40);
  const h = size + 40;
  const content = text(label, w / 2, h / 2 + size * 0.35, size, color, { weight: '600', glow: true });
  return { svg: svgDoc(w, h, content), w, h };
}

function pillBadgeAsset(label, color) {
  const w = Math.max(200, label.length * 18 + 60);
  const h = 56;
  const content = [
    roundedRect(2, 2, w - 4, h - 4, 28, color + '22', color, 2),
    text(label, w / 2, h / 2 + 8, 20, color, { weight: '600' }),
  ].join('\n');
  return { svg: svgDoc(w, h, content), w, h };
}

function iconCircleAsset(iconPaths, color) {
  const s = 200;
  const content = [
    circle(s / 2, s / 2, 80, color + '18', color, 3),
    `<g transform="translate(${s / 2 - 30}, ${s / 2 - 30}) scale(2.5)" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      ${iconPaths}
    </g>`,
  ].join('\n');
  return { svg: svgDoc(s, s, content), w: s, h: s };
}

function checkmarkAsset() {
  const s = 120;
  const content = [
    circle(s / 2, s / 2, 44, C.primary + '22', C.primary, 3),
    `<polyline points="35,60 52,76 85,44" fill="none" stroke="${C.primary}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow-green)"/>`,
  ].join('\n');
  return { svg: svgDoc(s, s, content), w: s, h: s };
}

function lockIconAsset() {
  const s = 120;
  const content = [
    `<g transform="translate(${s / 2 - 24}, ${s / 2 - 28})" fill="none" stroke="${C.dim}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="20" width="40" height="28" rx="4" fill="${C.dim}22"/>
      <path d="M12,20 V14 a12,12 0 0 1 24,0 V20"/>
    </g>`,
  ].join('\n');
  return { svg: svgDoc(s, s, content), w: s, h: s };
}

function arrowRightAsset(color = C.secondary) {
  const w = 200;
  const h = 80;
  const content = arrow(30, h / 2, w - 30, h / 2, color, 4);
  return { svg: svgDoc(w, h, content), w, h };
}

function arrowDownAsset(color = C.secondary) {
  const w = 80;
  const h = 200;
  const content = arrow(w / 2, 30, w / 2, h - 30, color, 4);
  return { svg: svgDoc(w, h, content), w, h };
}

function dividerLineAsset(color, width = 1200) {
  const w = width;
  const h = 20;
  const content = `<line x1="0" y1="10" x2="${w}" y2="10" stroke="${color}" stroke-width="3" filter="url(#${glowFilterId(color)})"/>`;
  return { svg: svgDoc(w, h, content), w, h };
}

function flowStepAsset(label, color) {
  const w = 340;
  const h = 100;
  const content = [
    roundedRect(8, 8, w - 16, h - 16, 14, C.card, color, 2),
    text(label, w / 2, h / 2 + 9, 22, C.white, { weight: '600' }),
  ].join('\n');
  return { svg: svgDoc(w, h, content), w, h };
}

function milestoneAsset(label, color, filled = false) {
  const s = 160;
  const content = [
    circle(s / 2, s / 2 - 10, 50, filled ? color + '33' : 'none', color, 3),
    text(label, s / 2, s / 2 + 55, 18, color, { weight: '600' }),
  ].join('\n');
  return { svg: svgDoc(s, s + 20, content), w: s, h: s + 20 };
}

function waveformAsset(color, width = 800) {
  const h = 120;
  let bars = '';
  for (let i = 0; i < 60; i++) {
    const x = 20 + i * (width - 40) / 60;
    const barH = 10 + Math.random() * 80 + Math.sin(i * 0.3) * 20;
    const y = (h - barH) / 2;
    bars += `<rect x="${x}" y="${y}" width="${(width - 40) / 80}" height="${barH}" rx="2" fill="${color}" opacity="${0.6 + Math.random() * 0.4}"/>`;
  }
  return { svg: svgDoc(width, h, bars), w: width, h };
}

function timerAsset(label, color) {
  const w = 500;
  const h = 200;
  const content = [
    roundedRect(8, 8, w - 16, h - 16, 20, C.card, color, 2.5),
    `<rect x="8" y="8" width="${w - 16}" height="${h - 16}" rx="20" ry="20" fill="${color}" opacity="0.06"/>`,
    text(label, w / 2, 80, 24, C.gray, { weight: '500' }),
    text('72:00:00', w / 2, 145, 56, color, { weight: '700', glow: true }),
  ].join('\n');
  return { svg: svgDoc(w, h, content), w, h };
}

function progressBarAsset(pct, color) {
  const w = 800;
  const h = 40;
  const barW = w - 20;
  const fillW = barW * pct;
  const content = [
    roundedRect(10, 8, barW, 24, 12, C.border),
    roundedRect(10, 8, fillW, 24, 12, color),
    `<rect x="10" y="8" width="${fillW}" height="24" rx="12" ry="12" fill="${color}" filter="url(#${glowFilterId(color)})" opacity="0.5"/>`,
  ].join('\n');
  return { svg: svgDoc(w, h, content), w, h };
}

function promptCardAsset(label, color) {
  const w = 600;
  const h = 80;
  const content = [
    roundedRect(4, 4, w - 8, h - 8, 12, C.card, color + '66', 1.5),
    text(label, w / 2, h / 2 + 8, 20, C.light, { weight: '400' }),
  ].join('\n');
  return { svg: svgDoc(w, h, content), w, h };
}

// Lucide-style icon paths (simplified SVGs at 24x24 viewbox)
const ICONS = {
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>',
  fileText: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
  user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  clipboard: '<path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14l2 2 4-4"/>',
  sparkles: '<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 13l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>',
  wand: '<path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8L19 13"/><path d="M15 9h0"/><path d="M17.8 6.2L19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2L11 5"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  mic: '<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  unlock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/>',
  sunrise: '<path d="M17 18a5 5 0 00-10 0"/><line x1="12" y1="9" x2="12" y2="2"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/><polyline points="8 6 12 2 16 6"/>',
  moon: '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>',
  record: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor"/>',
  save: '<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  people: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
  penTool: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
  camera: '<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>',
  imageIcon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  paintbrush: '<path d="M18.37 2.63L14 7l-1.59-1.59a2 2 0 00-2.82 0L8 7l9 9 1.59-1.59a2 2 0 000-2.82L17 10l4.37-4.37a2.12 2.12 0 10-3-3z"/><path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/><path d="M14.5 17.5L4.5 15"/>',
};

// ═══════════════════════════════════════════════════════════════
// ASSET MANIFEST — organized by folder
// ═══════════════════════════════════════════════════════════════

const CATEGORY_COLORS = {
  fun: C.secondary, health: C.primary, travel: C.accent,
  love: C.pink, family: C.primary, social: C.secondary,
  home: C.accent, work: C.energy, money: C.primary,
  stuff: C.secondary, giving: C.accent, spirituality: C.energy,
};

const CATEGORIES = ['Fun', 'Health', 'Travel', 'Love', 'Family', 'Social', 'Home', 'Work', 'Money', 'Stuff', 'Giving', 'Spirituality'];

const PHASE_COLORS = {
  Setup: C.secondary, Foundation: C.primary, 'Vision Creation': C.accent,
  Audio: C.accent, Activation: C.primary, Completion: C.energy,
};

const STEP_COLORS = [
  C.secondary, C.secondary,
  C.primary, C.primary,
  C.accent, C.accent,
  C.accent, C.accent, C.accent,
  C.primary, C.primary, C.primary,
  C.energy, C.energy,
];

function buildAssets() {
  const assets = [];
  const add = (path, gen) => assets.push({ path: path + '.png', generate: gen });

  // ── SHARED ──────────────────────────────────────────────
  for (let i = 1; i <= 14; i++) {
    add(`shared/step-badge-${String(i).padStart(2, '0')}`, () => stepBadgeAsset(i, STEP_COLORS[i - 1]));
  }
  for (const [name, color] of Object.entries(PHASE_COLORS)) {
    add(`shared/phase-${name.toLowerCase().replace(/ /g, '-')}`, () => phaseLabelAsset(name, color));
  }
  for (const cat of CATEGORIES) {
    const color = CATEGORY_COLORS[cat.toLowerCase()];
    add(`shared/category-${cat.toLowerCase()}`, () => categoryTileAsset(cat, color));
  }
  add('shared/checkmark', checkmarkAsset);
  add('shared/lock-icon', lockIconAsset);
  add('shared/arrow-right', () => arrowRightAsset(C.secondary));
  add('shared/arrow-right-green', () => arrowRightAsset(C.primary));
  add('shared/arrow-right-purple', () => arrowRightAsset(C.accent));
  add('shared/arrow-down', () => arrowDownAsset(C.secondary));
  add('shared/arrow-down-green', () => arrowDownAsset(C.primary));
  add('shared/progress-bar-25', () => progressBarAsset(0.25, C.primary));
  add('shared/progress-bar-50', () => progressBarAsset(0.50, C.primary));
  add('shared/progress-bar-75', () => progressBarAsset(0.75, C.primary));
  add('shared/progress-bar-100', () => progressBarAsset(1.0, C.primary));
  add('shared/divider-green', () => dividerLineAsset(C.primary));
  add('shared/divider-cyan', () => dividerLineAsset(C.secondary));

  // ── 01 DASHBOARD ────────────────────────────────────────
  add('01-dashboard/title-72hr-activation', () => titleAsset('72-Hour Activation Intensive', C.primary));
  add('01-dashboard/subtitle-14-step-path', () => subtitleAsset('Your 14-Step Activation Path', C.white));
  add('01-dashboard/timer-72hr', () => timerAsset('Time Remaining', C.primary));
  add('01-dashboard/label-step-x-of-14', () => pillBadgeAsset('Step 1 of 14', C.accent));

  add('01-dashboard/deliverable-life-vision', () => featureCardAsset('Crystal-Clear Life Vision', 'Written vision across 12 life categories', C.secondary));
  add('01-dashboard/deliverable-audio-tracks', () => featureCardAsset('Personalized Audio Tracks', 'Your future-self voice tracks', C.accent));
  add('01-dashboard/deliverable-vision-board', () => featureCardAsset('Custom Vision Board', 'Visual representation of your new reality', C.primary));
  add('01-dashboard/deliverable-calibration-call', () => featureCardAsset('Live Calibration Call', '1-on-1 session with a real coach', C.energy));
  add('01-dashboard/deliverable-map', () => featureCardAsset('My Activation Plan (MAP)', 'Your personalized 28-day activation system', C.primary));

  add('01-dashboard/unlock-advanced-audio', () => featureCardAsset('Advanced Audio Suite', 'Deeper tracks for your nervous system', C.accent));
  add('01-dashboard/unlock-alignment-gym', () => featureCardAsset('Alignment Gym', 'Weekly live coaching space', C.secondary));
  add('01-dashboard/unlock-vibe-tribe', () => featureCardAsset('Vibe Tribe Community', 'Real humans doing this work alongside you', C.primary));
  add('01-dashboard/unlock-additional-tools', () => featureCardAsset('Additional Tools', 'A full suite to live above the Green Line', C.energy));

  add('01-dashboard/label-graduate-unlocks', () => titleAsset('Graduate Unlocks', C.accent, 56));
  add('01-dashboard/label-what-youll-build', () => titleAsset("What You'll Build", C.secondary, 56));

  // ── 02 INTAKE ───────────────────────────────────────────
  add('02-intake/title', () => titleAsset('Pre-Intensive Intake', C.secondary));
  add('02-intake/subtitle', () => subtitleAsset('Snapshot of Your Inner World', C.secondary));
  add('02-intake/label-before-picture', () => labelAsset('Your "Before" Picture', C.secondary, 36));
  add('02-intake/label-1-10-scale', () => pillBadgeAsset('1-10 Scale', C.secondary));
  add('02-intake/label-avg-experience', () => labelAsset('Based on your average experience', C.light, 24));
  add('02-intake/label-submit-intake', () => pillBadgeAsset('Submit Intake', C.primary));
  add('02-intake/label-5-minutes', () => pillBadgeAsset('About 5 Minutes', C.energy));

  // ── 03 PROFILE ──────────────────────────────────────────
  add('03-profile/title', () => titleAsset('Your Profile', C.primary));
  add('03-profile/subtitle', () => subtitleAsset('A Versioned Snapshot of Who You Are', C.secondary));
  add('03-profile/label-whats-going-well', () => labelAsset("What's Going Well", C.primary, 32));
  add('03-profile/label-whats-not', () => labelAsset("What's Not Going Well", C.contrast, 32));
  add('03-profile/label-12-categories', () => pillBadgeAsset('12 Life Categories', C.secondary));
  add('03-profile/label-first-domino', () => labelAsset('The First Domino in the Chain', C.energy, 28));
  add('03-profile/flow-profile', () => flowStepAsset('Profile', C.primary));
  add('03-profile/flow-life-i-choose', () => flowStepAsset('Life I Choose', C.secondary));
  add('03-profile/flow-refinement', () => flowStepAsset('Vision Refinement', C.accent));
  add('03-profile/flow-audios', () => flowStepAsset('Vision Audios', C.accent));
  add('03-profile/flow-board', () => flowStepAsset('Vision Board', C.primary));
  add('03-profile/flow-map', () => flowStepAsset('Activation Plan', C.energy));
  add('03-profile/label-audio-option', () => pillBadgeAsset('Audio Option Available', C.accent));

  // ── 04 ASSESSMENT ───────────────────────────────────────
  add('04-assessment/title', () => titleAsset('Vibration Assessment', C.secondary));
  add('04-assessment/subtitle', () => subtitleAsset('Your Alignment X-Ray Across 12 Categories', C.secondary));
  add('04-assessment/the-green-line', () => dividerLineAsset(C.primary, 1400));
  add('04-assessment/label-above-green-line', () => titleAsset('Above the Green Line', C.primary, 48));
  add('04-assessment/label-below-green-line', () => titleAsset('Below the Green Line', C.contrast, 48));
  add('04-assessment/word-aligned', () => labelAsset('Aligned', C.primary, 36));
  add('04-assessment/word-thriving', () => labelAsset('Thriving', C.primary, 36));
  add('04-assessment/word-flow', () => labelAsset('Flow', C.primary, 36));
  add('04-assessment/word-clarity', () => labelAsset('Clarity', C.primary, 36));
  add('04-assessment/word-contrast', () => labelAsset('Contrast', C.contrast, 36));
  add('04-assessment/word-constraint', () => labelAsset('Constraint', C.contrast, 36));
  add('04-assessment/word-awareness', () => labelAsset('Awareness', C.contrast, 36));
  add('04-assessment/word-growth-edge', () => labelAsset('Growth Edge', C.contrast, 36));
  add('04-assessment/label-vibration-score', () => pillBadgeAsset('Vibration Score', C.primary));

  // ── 05 LIFE VISION ──────────────────────────────────────
  add('05-life-vision/title', () => titleAsset('Life Vision Builder', C.accent));
  add('05-life-vision/subtitle', () => subtitleAsset('The Heart of VibrationFit', C.white));
  add('05-life-vision/card-clarity', () => featureCardAsset('Clarity', "What you know you want more of", C.secondary));
  add('05-life-vision/card-contrast', () => featureCardAsset('Contrast', "What you're done with", C.orange));
  add('05-life-vision/label-the-life-i-choose', () => titleAsset('The Life I Choose', C.primary, 56));
  add('05-life-vision/label-get-me-started', () => pillBadgeAsset('Get Me Started', C.accent));
  add('05-life-vision/label-contrast-flip', () => labelAsset('VIVA flips your contrast into your vision', C.accent, 24));
  add('05-life-vision/label-present-tense', () => pillBadgeAsset('Present Tense', C.primary));
  add('05-life-vision/label-first-person', () => pillBadgeAsset('First Person', C.secondary));
  add('05-life-vision/label-feeling-words', () => pillBadgeAsset('Feeling Words', C.accent));
  add('05-life-vision/label-declaration', () => labelAsset("A Declaration, Not a Goal List", C.energy, 28));

  // ── 06 REFINE ───────────────────────────────────────────
  add('06-refine-vision/title', () => titleAsset('Refine Your Vision', C.accent));
  add('06-refine-vision/subtitle', () => subtitleAsset('Two Powerful VIVA Tools', C.accent));
  add('06-refine-vision/card-refine', () => featureCardAsset('Refine', 'Tell VIVA exactly what to tweak', C.accent));
  add('06-refine-vision/card-weave', () => featureCardAsset('Weave', 'Connect the dots between categories', C.secondary));
  add('06-refine-vision/label-add', () => pillBadgeAsset('+ Add', C.primary));
  add('06-refine-vision/label-remove', () => pillBadgeAsset('- Remove', C.contrast));
  add('06-refine-vision/label-notes', () => pillBadgeAsset('Notes to VIVA', C.accent));
  add('06-refine-vision/label-draft-mode', () => pillBadgeAsset('Draft Mode - Your Vision is Safe', C.primary));
  add('06-refine-vision/label-review-commit', () => pillBadgeAsset('Review & Commit', C.energy));
  add('06-refine-vision/label-highlight-mode', () => pillBadgeAsset('Highlight Mode', C.secondary));

  // ── 07 GENERATE AUDIO ───────────────────────────────────
  add('07-generate-audio/title', () => titleAsset('Generate Vision Audio', C.accent));
  add('07-generate-audio/subtitle', () => subtitleAsset('Your Future Self Has a Voice', C.accent));
  add('07-generate-audio/flow-written-vision', () => flowStepAsset('Written Vision', C.white));
  add('07-generate-audio/flow-choose-voice', () => flowStepAsset('Choose a Voice', C.accent));
  add('07-generate-audio/flow-14-sections', () => flowStepAsset('14 Audio Sections', C.primary));
  add('07-generate-audio/card-morning', () => featureCardAsset('Morning Activation', 'Start your day tuned in', C.primary));
  add('07-generate-audio/card-realtime', () => featureCardAsset('Real-Time Activation', 'Category boosts throughout the day', C.secondary));
  add('07-generate-audio/card-sleep', () => featureCardAsset('Sleep Immersion', 'Drift off to your new reality', C.accent));
  add('07-generate-audio/waveform-purple', () => waveformAsset(C.accent));
  add('07-generate-audio/waveform-cyan', () => waveformAsset(C.secondary));
  add('07-generate-audio/label-generate-audio-btn', () => pillBadgeAsset('Generate Audio', C.primary));
  add('07-generate-audio/label-separate-tracks', () => pillBadgeAsset('Separate Tracks', C.secondary));
  add('07-generate-audio/label-combined-track', () => pillBadgeAsset('Combined Track', C.accent));
  add('07-generate-audio/label-both', () => pillBadgeAsset('Both', C.primary));

  // ── 08 RECORD VOICE ─────────────────────────────────────
  add('08-record-voice/title', () => titleAsset('Record Your Own Voice', C.secondary));
  add('08-record-voice/subtitle', () => subtitleAsset('Declare Your Future', C.primary));
  add('08-record-voice/label-optional', () => pillBadgeAsset('Optional Step', C.energy));
  add('08-record-voice/flow-read-script', () => flowStepAsset('Read Your Script', C.secondary));
  add('08-record-voice/flow-record', () => flowStepAsset('Record', C.contrast));
  add('08-record-voice/flow-edit-trim', () => flowStepAsset('Edit & Trim', C.accent));
  add('08-record-voice/flow-save', () => flowStepAsset('Save', C.primary));
  add('08-record-voice/label-keep-going', () => labelAsset("If you mess up, keep going!", C.energy, 28));
  add('08-record-voice/label-your-voice', () => labelAsset('Your voice. Your vision. Your declaration.', C.accent, 24));

  // ── 09 AUDIO MIX ────────────────────────────────────────
  add('09-audio-mix/title', () => titleAsset('Audio Mixing', C.accent));
  add('09-audio-mix/subtitle', () => subtitleAsset('From Voice Memo to Cinematic Soundtrack', C.secondary));
  add('09-audio-mix/label-your-voice', () => labelAsset('Your Voice', C.accent, 32));
  add('09-audio-mix/label-background-music', () => labelAsset('Background Music', C.secondary, 32));
  add('09-audio-mix/label-70-pct', () => titleAsset('70%', C.accent, 64));
  add('09-audio-mix/label-30-pct', () => titleAsset('30%', C.secondary, 64));
  add('09-audio-mix/card-sleep', () => featureCardAsset('Sleep', 'Deep relaxation', C.accent));
  add('09-audio-mix/card-meditation', () => featureCardAsset('Meditation', 'Centered calm', C.secondary));
  add('09-audio-mix/card-power', () => featureCardAsset('Power', 'Energized drive', C.primary));
  add('09-audio-mix/card-custom', () => featureCardAsset('Custom', 'Build your own mix', C.energy));
  add('09-audio-mix/label-recommended-combos', () => pillBadgeAsset('Recommended Combos', C.accent));
  add('09-audio-mix/label-build-my-own', () => pillBadgeAsset('Build My Own', C.secondary));
  add('09-audio-mix/waveform-voice', () => waveformAsset(C.accent, 600));
  add('09-audio-mix/waveform-music', () => waveformAsset(C.secondary, 600));
  add('09-audio-mix/label-generate-mix', () => pillBadgeAsset('Generate Mix', C.primary));

  // ── 10 VISION BOARD ─────────────────────────────────────
  add('10-vision-board/title', () => titleAsset('Vision Board', C.primary));
  add('10-vision-board/subtitle', () => subtitleAsset('Your Vision Gets a Face', C.primary));
  add('10-vision-board/label-one-per-category', () => labelAsset('One Image Per Life Category', C.primary, 28));
  add('10-vision-board/label-viva-ideas', () => pillBadgeAsset('Get VIVA Ideas', C.accent));
  add('10-vision-board/label-create-own', () => pillBadgeAsset('Create Your Own', C.secondary));
  add('10-vision-board/label-generate-viva', () => pillBadgeAsset('Generate with VIVA', C.accent));
  add('10-vision-board/label-3-ideas-per-cat', () => labelAsset('3 Tailored Ideas Per Category', C.accent, 24));

  // ── 11 JOURNAL ──────────────────────────────────────────
  add('11-journal/title', () => titleAsset('Journal', C.secondary));
  add('11-journal/subtitle', () => subtitleAsset('Your Transformation Evidence', C.secondary));
  add('11-journal/label-conscious-creation-log', () => labelAsset('Your Conscious Creation Log', C.secondary, 28));
  add('11-journal/pill-text', () => pillBadgeAsset('Text', C.secondary));
  add('11-journal/pill-voice', () => pillBadgeAsset('Voice', C.accent));
  add('11-journal/pill-video', () => pillBadgeAsset('Video', C.primary));
  add('11-journal/pill-images', () => pillBadgeAsset('Images', C.energy));
  add('11-journal/prompt-win', () => promptCardAsset('A win you\'ve had recently, big or small', C.primary));
  add('11-journal/prompt-different', () => promptCardAsset('Something that feels different since starting', C.secondary));
  add('11-journal/prompt-contrast', () => promptCardAsset('Contrast you\'re processing and learning from', C.accent));
  add('11-journal/prompt-appreciating', () => promptCardAsset('Things you\'re appreciating right now', C.energy));
  add('11-journal/label-tag-categories', () => labelAsset('Tag entries by Life Category', C.light, 22));

  // ── 12 BOOK CALL ────────────────────────────────────────
  add('12-book-call/title', () => titleAsset('Calibration Call', C.energy));
  add('12-book-call/subtitle', () => subtitleAsset('Your 1-on-1 Graduate Welcome', C.energy));
  add('12-book-call/card-celebrate', () => numberedCardAsset(1, 'Celebrate Your Shifts', 'Acknowledge what\'s changed', C.primary));
  add('12-book-call/card-unlocks', () => numberedCardAsset(2, 'Walk Through Graduate Unlocks', 'Discover your new tools', C.accent));
  add('12-book-call/card-success', () => numberedCardAsset(3, 'Set Up Your Success', 'Launch as a member', C.secondary));
  add('12-book-call/label-schedule-call', () => pillBadgeAsset('Schedule Call', C.energy));
  add('12-book-call/label-real-humans', () => labelAsset('Real humans. Real celebration. Real next steps.', C.light, 22));

  // ── 13 MAP ──────────────────────────────────────────────
  add('13-map/title', () => titleAsset('My Activation Plan', C.primary));
  add('13-map/subtitle', () => subtitleAsset('Your MAP to Consistent Vision Activation', C.primary));
  add('13-map/card-morning', () => numberedCardAsset('AM', 'Morning Activation', 'Listen to your vision audio + set intention', C.primary));
  add('13-map/card-daytime', () => numberedCardAsset('PM', 'Real-Time Activation', 'Category boosts + journal wins', C.energy));
  add('13-map/card-evening', () => numberedCardAsset('ZZ', 'Sleep Immersion', 'Vision audio as you drift off', C.accent));
  add('13-map/badge-day-3', () => milestoneAsset('Day 3', C.dim, false));
  add('13-map/badge-day-7', () => milestoneAsset('Day 7', C.primary, false));
  add('13-map/badge-day-14', () => milestoneAsset('Day 14', C.secondary, false));
  add('13-map/badge-day-21', () => milestoneAsset('Day 21', C.energy, false));
  add('13-map/badge-day-28', () => milestoneAsset('Day 28', C.accent, true));
  add('13-map/label-28-days', () => titleAsset('28 Days', C.primary, 64));
  add('13-map/label-daily-weekly', () => labelAsset('Daily Activations + Weekly Alignment', C.light, 24));
  add('13-map/label-continue-unlock', () => pillBadgeAsset('Continue to Unlock Platform', C.primary));

  // ── 14 UNLOCK ───────────────────────────────────────────
  add('14-unlock/title', () => titleAsset('Platform Unlock', C.energy));
  add('14-unlock/subtitle', () => subtitleAsset('You Are a VibrationFit Graduate', C.energy));
  add('14-unlock/label-you-did-the-work', () => labelAsset('You Did the Work', C.primary, 36));
  add('14-unlock/label-graduation-moment', () => labelAsset('This Is Your Graduation Moment', C.energy, 28));
  add('14-unlock/unlock-advanced-audio', () => featureCardAsset('Advanced Audio Suite', 'Now unlocked', C.accent));
  add('14-unlock/unlock-alignment-gym', () => featureCardAsset('Alignment Gym', 'Now unlocked', C.secondary));
  add('14-unlock/unlock-vibe-tribe', () => featureCardAsset('Vibe Tribe Community', 'Now unlocked', C.primary));
  add('14-unlock/unlock-full-platform', () => featureCardAsset('Full Platform Access', 'Now unlocked', C.energy));
  add('14-unlock/label-unlock-platform', () => pillBadgeAsset('Unlock Platform', C.primary));
  add('14-unlock/label-welcome', () => titleAsset('Welcome to VibrationFit Membership', C.primary, 44));
  add('14-unlock/label-14-of-14', () => pillBadgeAsset('14 of 14 Complete', C.primary));

  return assets;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  const assets = buildAssets();
  console.log(`\nGenerating ${assets.length} overlay assets...\n`);

  let success = 0;
  let failed = 0;

  for (const asset of assets) {
    const outPath = join(OUTPUT_DIR, asset.path);
    const dir = dirname(outPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    try {
      const result = asset.generate();
      const svgBuffer = Buffer.from(result.svg);
      await sharp(svgBuffer)
        .png({ quality: 100 })
        .toFile(outPath);

      success++;
      process.stdout.write(`  [${success}/${assets.length}] ${asset.path}\n`);
    } catch (err) {
      failed++;
      console.error(`  FAIL ${asset.path}: ${err.message}`);
    }
  }

  console.log(`\nDone! ${success} generated, ${failed} failed.`);
  console.log(`Output: ${OUTPUT_DIR}/`);
}

main().catch(console.error);
