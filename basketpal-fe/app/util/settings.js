const KEY = 'basketpal_settings';

const DEFAULTS = {
    favTeamNBA: '',
    favTeamWNBA: '',
    aiEnabled: true,
    notifications: false,
    spoilerShield: false,
};

// c1 = chip background, c2 = chip text (official team colors)
export const NBA_TEAMS = [
    { id: 1610612737, name: 'Atlanta Hawks', abbr: 'ATL', c1: '#E03A3E', c2: '#C1D32F' },
    { id: 1610612738, name: 'Boston Celtics', abbr: 'BOS', c1: '#007A33', c2: '#FFFFFF' },
    { id: 1610612751, name: 'Brooklyn Nets', abbr: 'BKN', c1: '#000000', c2: '#FFFFFF' },
    { id: 1610612766, name: 'Charlotte Hornets', abbr: 'CHA', c1: '#1D1160', c2: '#00788C' },
    { id: 1610612741, name: 'Chicago Bulls', abbr: 'CHI', c1: '#CE1141', c2: '#000000' },
    { id: 1610612739, name: 'Cleveland Cavaliers', abbr: 'CLE', c1: '#860038', c2: '#FDBB30' },
    { id: 1610612742, name: 'Dallas Mavericks', abbr: 'DAL', c1: '#00538C', c2: '#B8C4CA' },
    { id: 1610612743, name: 'Denver Nuggets', abbr: 'DEN', c1: '#0E2240', c2: '#FEC524' },
    { id: 1610612765, name: 'Detroit Pistons', abbr: 'DET', c1: '#C8102E', c2: '#FFFFFF' },
    { id: 1610612744, name: 'Golden State Warriors', abbr: 'GSW', c1: '#1D428A', c2: '#FFC72C' },
    { id: 1610612745, name: 'Houston Rockets', abbr: 'HOU', c1: '#CE1141', c2: '#C4CED4' },
    { id: 1610612754, name: 'Indiana Pacers', abbr: 'IND', c1: '#002D62', c2: '#FDBB30' },
    { id: 1610612746, name: 'LA Clippers', abbr: 'LAC', c1: '#C8102E', c2: '#FFFFFF' },
    { id: 1610612747, name: 'Los Angeles Lakers', abbr: 'LAL', c1: '#552583', c2: '#FDB927' },
    { id: 1610612763, name: 'Memphis Grizzlies', abbr: 'MEM', c1: '#5D76A9', c2: '#12173F' },
    { id: 1610612748, name: 'Miami Heat', abbr: 'MIA', c1: '#98002E', c2: '#F9A01B' },
    { id: 1610612749, name: 'Milwaukee Bucks', abbr: 'MIL', c1: '#00471B', c2: '#EEE1C6' },
    { id: 1610612750, name: 'Minnesota Timberwolves', abbr: 'MIN', c1: '#0C2340', c2: '#78BE20' },
    { id: 1610612740, name: 'New Orleans Pelicans', abbr: 'NOP', c1: '#0C2340', c2: '#C8102E' },
    { id: 1610612752, name: 'New York Knicks', abbr: 'NYK', c1: '#006BB6', c2: '#F58426' },
    { id: 1610612760, name: 'Oklahoma City Thunder', abbr: 'OKC', c1: '#007AC1', c2: '#EF3B24' },
    { id: 1610612753, name: 'Orlando Magic', abbr: 'ORL', c1: '#0077C0', c2: '#C4CED4' },
    { id: 1610612755, name: 'Philadelphia 76ers', abbr: 'PHI', c1: '#006BB6', c2: '#ED174C' },
    { id: 1610612756, name: 'Phoenix Suns', abbr: 'PHX', c1: '#1D1160', c2: '#E56020' },
    { id: 1610612757, name: 'Portland Trail Blazers', abbr: 'POR', c1: '#E03A3E', c2: '#000000' },
    { id: 1610612758, name: 'Sacramento Kings', abbr: 'SAC', c1: '#5A2D81', c2: '#63727A' },
    { id: 1610612759, name: 'San Antonio Spurs', abbr: 'SAS', c1: '#000000', c2: '#C4CED4' },
    { id: 1610612761, name: 'Toronto Raptors', abbr: 'TOR', c1: '#CE1141', c2: '#000000' },
    { id: 1610612762, name: 'Utah Jazz', abbr: 'UTA', c1: '#002B5C', c2: '#F9A01B' },
    { id: 1610612764, name: 'Washington Wizards', abbr: 'WAS', c1: '#002B5C', c2: '#E31837' },
];

export const WNBA_TEAMS = [
    { id: 1611661317, name: 'Atlanta Dream', abbr: 'DRM', c1: '#C8102E', c2: '#FFCD00' },
    { id: 1611661319, name: 'Chicago Sky', abbr: 'CHI', c1: '#418FDE', c2: '#FFCD00' },
    { id: 1611661323, name: 'Connecticut Sun', abbr: 'CON', c1: '#DC4405', c2: '#041E42' },
    { id: 1611661320, name: 'Dallas Wings', abbr: 'DAL', c1: '#002B5C', c2: '#C4D600' },
    { id: 1611661332, name: 'Golden State Valkyries', abbr: 'GSV', c1: '#7E3FBE', c2: '#FFFFFF' },
    { id: 1611661321, name: 'Indiana Fever', abbr: 'IND', c1: '#002D62', c2: '#FFCD00' },
    { id: 1611661325, name: 'Las Vegas Aces', abbr: 'LVA', c1: '#000000', c2: '#BA0C2F' },
    { id: 1611661322, name: 'Los Angeles Sparks', abbr: 'LAS', c1: '#552583', c2: '#FFC72C' },
    { id: 1611661313, name: 'Minnesota Lynx', abbr: 'MIN', c1: '#0C2340', c2: '#78BE20' },
    { id: 1611661324, name: 'New York Liberty', abbr: 'NYL', c1: '#6ECEB2', c2: '#000000' },
    { id: 1611661328, name: 'Phoenix Mercury', abbr: 'PHX', c1: '#201747', c2: '#CB6015' },
    { id: 1611661329, name: 'Seattle Storm', abbr: 'SEA', c1: '#2C5234', c2: '#FBE122' },
    { id: 1611661330, name: 'Washington Mystics', abbr: 'WAS', c1: '#002B5C', c2: '#C8102E' },
];

export function getSettings() {
    if (typeof window === 'undefined') return DEFAULTS;
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
    } catch {
        return DEFAULTS;
    }
}

export function saveSettings(settings) {
    localStorage.setItem(KEY, JSON.stringify(settings));
}
