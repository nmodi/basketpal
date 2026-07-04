import { getAllColors, getMainColor } from 'nba-color';

// ponytail: hardcoded since nba-color has no WNBA data
export const WNBA_COLORS = {
    ATL: { main: '#E03A3E', accent: '#002B5C' }, // Dream: red + navy
    CHI: { main: '#418FDE', accent: '#FFCD00' }, // Sky: sky blue + radiant yellow
    CON: { main: '#003767', accent: '#F4A629' }, // Sun: navy + orange
    DAL: { main: '#002B5C', accent: '#78BE20' }, // Wings: navy + lime
    IND: { main: '#002D62', accent: '#FFCD00' }, // Fever: navy + gold
    LVA: { main: '#010101', accent: '#A7A8A9' }, // Aces: black + silver
    LAS: { main: '#552583', accent: '#FDB927' }, // Sparks: purple + gold
    MIN: { main: '#79B2DE', accent: '#266092' }, // Lynx: light blue + dark blue (avoid clash with NBA MIN)
    NYL: { main: '#010101', accent: '#6ECEB2' }, // Liberty: black + seafoam green
    PHX: { main: '#5C2D91', accent: '#E56020' }, // Mercury: purple + orange
    SEA: { main: '#2C5234', accent: '#FED300' }, // Storm: green + yellow
    WAS: { main: '#C8102E', accent: '#002B5C' }, // Mystics: red + navy
    GSV: { main: '#010101', accent: '#AD96DC' }, // Valkyries: black + valkyrie violet
    TOR: { main: '#612C51', accent: '#B8CCEA' }, // Tempo: bordeaux + hydrogen blue
    PDX: { main: '#E91E8C', accent: '#8BC8E5' }, // Fire: blazing pink + light blue
};

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

export const WNBA_TEAM_OVERRIDES = {
    ATL: 'baseline',
    CHI: 'baseline',
    CON: 'pop',
    DAL: 'pop',
    GSV: 'twoTonePop',
    IND: 'pop',
    LVA: 'twoTonePop',
    LAS: 'pop',
    NYL: 'twoTonePop',
    PDX: 'twoTonePop',
    PHX: 'twoTonePop',
    SEA: 'twoTonePop',
    TOR: 'pop',
};

// Override the strategy for specific NBA teams.
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

// Pure function of (tricode, strategyOverride), but getAllColors/getMainColor
// rebuild the full nba-color dataset per call and this runs several times per
// 5s poll render — cache the results.
const styleCache = new Map();

export function getTeamStyle(tricode, strategyOverride) {
    const cacheKey = `${tricode}|${strategyOverride ?? ''}`;
    if (styleCache.has(cacheKey)) return styleCache.get(cacheKey);

    let mainHex, accentHex;
    const isWnba = !!WNBA_COLORS[tricode];
    if (isWnba) {
        ({ main: mainHex, accent: accentHex } = WNBA_COLORS[tricode]);
    } else {
        const allData = getAllColors();
        const teamData = allData[tricode];
        mainHex = getMainColor(tricode)?.hex ?? '#1d4ed8';
        const allHexes = teamData ? Object.values(teamData.colors).map(c => c.hex) : [mainHex];
        accentHex = getBestAccent(mainHex, allHexes);
    }
    const strategyName = strategyOverride ?? (isWnba ? WNBA_TEAM_OVERRIDES[tricode] : TEAM_OVERRIDES[tricode]) ?? DEFAULT_STRATEGY;
    const style = STRATEGIES[strategyName](mainHex, accentHex);
    styleCache.set(cacheKey, style);
    return style;
}

export const STRATEGY_NAMES = Object.keys(STRATEGIES);
export const WNBA_TRICODES = Object.keys(WNBA_COLORS);

