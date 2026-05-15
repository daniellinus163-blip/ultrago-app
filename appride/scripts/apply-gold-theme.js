const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src');

const replacements = [
  ["backgroundColor: 'rgba(5,8,22,0.92)'", 'backgroundColor: colors.card'],
  ["backgroundColor: 'rgba(5, 8, 22, 0.92)'", 'backgroundColor: colors.card'],
  ["backgroundColor: 'rgba(5,8,22,0.98)'", 'backgroundColor: colors.card'],
  ["backgroundColor: 'rgba(5, 8, 22, 0.96)'", 'backgroundColor: colors.card'],
  ["backgroundColor: 'rgba(17,24,39,0.55)'", 'backgroundColor: colors.surfaceElevated'],
  ["backgroundColor: 'rgba(30, 41, 59, 0.65)'", 'backgroundColor: colors.surfaceElevated'],
  ["backgroundColor: 'rgba(30, 41, 59, 0.45)'", 'backgroundColor: colors.secondary'],
  ["backgroundColor: 'rgba(30, 41, 59, 0.55)'", 'backgroundColor: colors.secondary'],
  ["backgroundColor: 'rgba(30, 41, 59, 0.75)'", 'backgroundColor: colors.surfaceElevated'],
  ["backgroundColor: 'rgba(15,23,42,0.92)'", 'backgroundColor: colors.card'],
  ["borderColor: 'rgba(250,204,21,0.35)'", 'borderColor: colors.border'],
  ["borderColor: 'rgba(250, 204, 21, 0.35)'", 'borderColor: colors.border'],
  ["borderColor: 'rgba(250,204,21,0.25)'", 'borderColor: colors.borderSubtle'],
  ["backgroundColor: 'rgba(250, 204, 21, 0.12)'", 'backgroundColor: colors.goldTint'],
  ["backgroundColor: 'rgba(250,204,21,0.12)'", 'backgroundColor: colors.goldTint'],
  ["backgroundColor: 'rgba(250, 204, 21, 0.08)'", 'backgroundColor: colors.goldTint'],
  ["backgroundColor: 'rgba(250, 204, 21, 0.14)'", 'backgroundColor: colors.goldTint'],
  ["backgroundColor: 'rgba(250, 204, 21, 0.16)'", 'backgroundColor: colors.goldTint'],
  ["backgroundColor: 'rgba(250, 204, 21, 0.2)'", 'backgroundColor: colors.goldTintStrong'],
  ["backgroundColor: 'rgba(248,250,252,0.2)'", 'backgroundColor: colors.goldTint'],
  ["color: '#0a0a0a'", 'color: colors.textOnGold'],
  ['ActivityIndicator size="large" color="#0a0a0a"', 'ActivityIndicator size="large" color={colors.textOnGold}'],
  ["colors={['#FFD60A', '#FACC15', '#EAB308']}", 'colors={gradients.screenGold}'],
  ["colors={['#FFD60A', '#FACC15', '#EAB308', '#FDE047']}", 'colors={gradients.screenGold}'],
  ["colors={['rgba(17,24,39,0.97)', 'rgba(5,8,22,0.98)']}", 'colors={gradients.sheet}'],
  ["colors={['rgba(30,41,59,0.9)', 'rgba(15,23,42,0.75)']}", 'colors={gradients.chip}'],
  ["colors={['rgba(251,192,45,0.95)', 'rgba(196,144,0,0.92)']}", 'colors={gradients.rideTypeActive}'],
  ['userInterfaceStyle="dark"', 'userInterfaceStyle="light"'],
  ['<DriverPulse color="#22d3ee" />', '<DriverPulse color={colors.primaryDark} />'],
  ["backgroundColor: 'rgba(5,8,22,0.75)'", 'backgroundColor: colors.overlay'],
  ["color: 'rgba(10,10,10,0.78)'", 'color: colors.textMuted'],
  ["color: 'rgba(10,10,10,0.75)'", 'color: colors.textMuted'],
  ["color: 'rgba(10,10,10,0.72)'", 'color: colors.textMuted'],
  ["color: 'rgba(10,10,10,0.7)'", 'color: colors.textMuted'],
  ["color: 'rgba(10,10,10,0.65)'", 'color: colors.textSubtle'],
  ["color: 'rgba(10,10,10,0.6)'", 'color: colors.textSubtle'],
];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
      continue;
    }
    if (!/\.(tsx|ts)$/.test(name) || name === 'colors.ts') {
      continue;
    }
    let content = fs.readFileSync(p, 'utf8');
    const original = content;
    for (const [from, to] of replacements) {
      content = content.split(from).join(to);
    }
    if (content === original) {
      continue;
    }
    const needsGradients =
      content.includes('gradients.') && !content.includes("from '../../theme/colors'") && !content.includes("from '../theme/colors'");
    const needsColors =
      /colors\.(card|goldTint|overlay|surfaceElevated|secondary|border|textOnGold)/.test(content) &&
      !content.includes("from '../../theme/colors'") &&
      !content.includes("from '../theme/colors'");

    if (needsGradients || needsColors) {
      const depth = p.replace(/\\/g, '/').split('/src/')[1].split('/').length - 1;
      const prefix = depth <= 1 ? '../' : '../../'.repeat(depth);
      const importLine = `import { colors${needsGradients ? ', gradients' : ''} } from '${prefix}theme/colors';`;
      if (content.includes("from 'react'")) {
        content = content.replace(/import React[^\n]*\n/, (m) => m + importLine + '\n');
      } else {
        content = importLine + '\n' + content;
      }
    }
    fs.writeFileSync(p, content);
    console.log('updated', path.relative(root, p));
  }
}

walk(root);
