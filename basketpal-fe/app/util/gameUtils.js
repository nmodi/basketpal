import { calculateGameScore, calculatePIE, getTrueShootingPercentage } from '../util/statFunctions';

import { League } from './league';

export const formatGameClock = (gameClock) => {
    if (!gameClock) return null;
    const match = /^PT(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(gameClock);
    if (!match) return null;
    const minutes = Number.parseInt(match[1] ?? '0', 10);
    const seconds = Math.floor(Number.parseFloat(match[2] ?? '0'));
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export const getScoreColor = (teamScore, otherTeamScore, isFinal) => {
    if (!isFinal) return 'var(--chyron-fg)';
    if (teamScore == null || otherTeamScore == null) return 'var(--chyron-fg)';
    if (teamScore > otherTeamScore) return 'var(--highlight)';
    if (teamScore < otherTeamScore) return 'var(--fg-muted)';
    return 'var(--chyron-fg)';
}

export const getGameResult = (gameData) => {

    if (gameData.homeTeam.score > gameData.awayTeam.score) {
        return {winningTeam: gameData.homeTeam, losingTeam: gameData.awayTeam}
    }

    return {winningTeam: gameData.awayTeam, losingTeam: gameData.homeTeam}
}


export const getTopPlayers = (team, N) => {
    return team.players
        .map(p => (
            {...p,
                teamId: team.teamId,
                gameScore: calculateGameScore(p.stats),
                teamStats: team.statistics,
                pie: calculatePIE(p, team.statistics)
            }))
        .sort((a, b) => b.pie - a.pie)
        .slice(0, N);
}

const withPercentages = (stats) => ({
    ...stats,
    fieldGoalsPercentage: stats.fieldGoalsAttempted ? stats.fieldGoalsMade / stats.fieldGoalsAttempted : 0,
    freeThrowsPercentage: stats.freeThrowsAttempted ? stats.freeThrowsMade / stats.freeThrowsAttempted : 0,
    threePointersPercentage: stats.threePointersAttempted ? stats.threePointersMade / stats.threePointersAttempted : 0,
});

export const evaluateKeysToTheWin = (winningTeam, losingTeam, N = 3) => {

    const winningTeamStats = withPercentages(winningTeam.statistics);
    const losingTeamStats = withPercentages(losingTeam.statistics);

    // Define the stats to compare along with their weights
    const keyStats = {
        'assists': 1,
        'benchPoints': 0.5,
        'reboundsOffensive': 2,
        'reboundsTotal': 2,
        'steals': 1,
        'blocks': 0.5,
        'fieldGoalsPercentage': 2,
        'freeThrowsAttempted': 0.5,
        'fastBreakPointsMade': 1,
        'freeThrowsPercentage': 1,
        'threePointersPercentage': 1.5,
        'threePointersMade': 1,
        'turnovers': -2
    };

    // Calculate the weighted percentage difference for each stat
    let statDiffs = [];

    Object.keys(keyStats).forEach(stat => {
        if (winningTeamStats.hasOwnProperty(stat) && losingTeamStats.hasOwnProperty(stat)) {

            // Calculate percentage difference
            let difference = winningTeamStats[stat] - losingTeamStats[stat];
            let average = (winningTeamStats[stat] + losingTeamStats[stat]) / 2;
            let percentageDifference = (difference / average) * 100;

            // Apply weight to the percentage difference
            let percentageDiff = percentageDifference * keyStats[stat];

            statDiffs.push({ 
                name: stat, 
                percentageDiff,
                winningTeamValue: winningTeamStats[stat], 
                losingTeamValue: losingTeamStats[stat]
            });
        }
    });

    // Sort the differences, giving priority to positive differences in the winning team's favor
    statDiffs.sort((a, b) => {
        if (a.percentageDiff > 0 && b.percentageDiff < 0) return -1;
        if (a.percentageDiff < 0 && b.percentageDiff > 0) return 1;
        return Math.abs(b.percentageDiff) - Math.abs(a.percentageDiff);
    });

    // Get the top N most uneven stats
    const topStats = statDiffs.slice(0, N);

    // Construct objects for the winning team and losing team
    const winningTeamTopStats = {};
    const losingTeamTopStats = {};

    topStats.forEach(stat => {
        if (stat.percentageDiff > 0) {
            winningTeamTopStats[stat.name] = stat.winningTeamValue;
            losingTeamTopStats[stat.name] = stat.losingTeamValue;
        }
    });

    return { 
        winningTeamTopStats, 
        losingTeamTopStats 
    };
}