import { getAllColors, getMainColor } from 'nba-color';

// ─── color math ──────────────────────────────────────────────────────────────

function getLuminance(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const lin = c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function getChroma(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return Math.max(r, g, b) - Math.min(r, g, b);
}

function isReadableOnDark(hex) {
    return getLuminance(hex) > 0.12;
}

function hexAlpha(hex, alpha) {
    return hex + Math.round(alpha * 255).toString(16).padStart(2, '0');
}

// Most colorful non-main color that isn't near-white or near-black
function getBestAccent(mainHex, allHexes) {
    const candidates = allHexes.filter(h => h !== mainHex);
    const colorful = candidates
        .filter(h => { const l = getLuminance(h); return l > 0.04 && l < 0.88; })
        .sort((a, b) => getChroma(b) - getChroma(a));
    return colorful[0] ?? candidates[0] ?? '#888888';
}

// ─── strategy builders ───────────────────────────────────────────────────────

// Each strategy returns { barColor, nameColor, strategyName, getGradient(direction) }

function baseline(mainHex, accentHex) {
    return {
        barColor: mainHex,
        nameColor: '#f2f4f8',
        strategyName: 'baseline',
        getGradient: (dir) => `linear-gradient(to ${dir}, ${hexAlpha(mainHex, 0.22)}, transparent 80%)`,
    };
}

function twoTone(mainHex, accentHex) {
    return {
        barColor: mainHex,
        nameColor: '#f2f4f8',
        strategyName: 'twoTone',
        getGradient: (dir) => `linear-gradient(to ${dir}, ${hexAlpha(mainHex, 0.32)}, ${hexAlpha(accentHex, 0.18)}, transparent 75%)`,
    };
}

function pop(mainHex, accentHex) {
    const nameColor = isReadableOnDark(accentHex) ? accentHex : '#f2f4f8';
    return {
        barColor: accentHex,
        nameColor,
        strategyName: 'pop',
        getGradient: (dir) => `linear-gradient(to ${dir}, ${hexAlpha(mainHex, 0.45)}, transparent 80%)`,
    };
}

function bold(mainHex, accentHex) {
    const nameColor = isReadableOnDark(accentHex) ? accentHex : '#f2f4f8';
    return {
        barColor: mainHex,
        nameColor,
        strategyName: 'bold',
        getGradient: (dir) => `linear-gradient(to ${dir}, ${hexAlpha(mainHex, 0.45)}, transparent 80%)`,
    };
}

function twoTonePop(mainHex, accentHex) {
    const nameColor = isReadableOnDark(accentHex) ? accentHex : '#f2f4f8';
    return {
        barColor: accentHex,
        nameColor,
        strategyName: 'twoTonePop',
        getGradient: (dir) => `linear-gradient(to ${dir}, ${hexAlpha(mainHex, 0.32)}, ${hexAlpha(accentHex, 0.18)}, transparent 75%)`,
    };
}

const STRATEGIES = { baseline, twoTone, twoTonePop, pop, bold };

// ─── config ──────────────────────────────────────────────────────────────────

const DEFAULT_STRATEGY = 'bold';

// Override the strategy for specific teams.
// Valid values: 'baseline' | 'twoTone' | 'pop' | 'bold'
export const TEAM_OVERRIDES = {
    BKN: 'twoTonePop',
    CHA: 'pop',
    DAL: 'baseline',
    GSW: 'twoTone',
    IND: 'pop',
    MIN: 'pop',
    NYK: 'pop',
    NOP: 'pop',
    PHI: 'pop',
    PHX: 'baseline',
    SAC: 'baseline',
    WAS: 'twoTone',
    LAL: 'pop',
    DET: 'pop',
    LAC: 'twoTonePop',
};

// ─── public API ──────────────────────────────────────────────────────────────

export function getTeamStyle(tricode) {
    const allData = getAllColors();
    const teamData = allData[tricode];
    const mainHex = getMainColor(tricode)?.hex ?? '#1d4ed8';
    const allHexes = teamData ? Object.values(teamData.colors).map(c => c.hex) : [mainHex];
    const accentHex = getBestAccent(mainHex, allHexes);
    const strategyName = TEAM_OVERRIDES[tricode] ?? DEFAULT_STRATEGY;
    return STRATEGIES[strategyName](mainHex, accentHex);
}

// Exposed so the colors reference page can render all variants
export function getAllTeamVariants(tricode) {
    const allData = getAllColors();
    const teamData = allData[tricode];
    const mainHex = getMainColor(tricode)?.hex ?? '#1d4ed8';
    const allHexes = teamData ? Object.values(teamData.colors).map(c => c.hex) : [mainHex];
    const accentHex = getBestAccent(mainHex, allHexes);
    return {
        mainHex,
        accentHex,
        variants: Object.fromEntries(
            Object.entries(STRATEGIES).map(([name, fn]) => [name, fn(mainHex, accentHex)])
        ),
        activeStrategy: TEAM_OVERRIDES[tricode] ?? DEFAULT_STRATEGY,
    };
}
