export const hasTripleDouble = (stats) => {

    const { points, reboundsTotal, assists, steals, blocks } = stats;

    let doubleDigitCount = 0;
  
    if (points >= 10) doubleDigitCount++;
    if (reboundsTotal >= 10) doubleDigitCount++;
    if (assists >= 10) doubleDigitCount++;
    if (steals >= 10) doubleDigitCount++;
    if (blocks >= 10) doubleDigitCount++;
  
    return doubleDigitCount >= 3;
}


export const tripleDoubleWatch = (stats) => {
    const { points, reboundsTotal, assists, steals, blocks } = stats;
  
    let almostDoubleCount = 0;
  
    if (points >= 8) almostDoubleCount++;
    if (reboundsTotal >= 8) almostDoubleCount++;
    if (assists >= 8) almostDoubleCount++;
    if (steals >= 8) almostDoubleCount++;
    if (blocks >= 8) almostDoubleCount++;
  
    return almostDoubleCount >= 3;
}

export const getTrueShootingPercentage = (stats) => {

    const {fieldGoalsAttempted, freeThrowsAttempted, points} = stats; 

    if (fieldGoalsAttempted === 0 && freeThrowsAttempted === 0) {
        return 0;
    }

    const tsPercentage = points / (2 * (fieldGoalsAttempted + 0.44 * freeThrowsAttempted));
    return tsPercentage;
}

export const calculateGameScore = (stats) => {

    const {
        points,
        fieldGoalsMade,
        fieldGoalsAttempted,
        freeThrowsAttempted,
        reboundsOffensive,
        reboundsDefensive,
        steals,
        assists,
        blocks,
        foulsPersonal,
        turnovers
    } = stats;

    const gameScore = points + 
                      0.4 * fieldGoalsMade - 
                      0.7 * fieldGoalsAttempted - 
                      0.4 * freeThrowsAttempted + 
                      0.7 * reboundsOffensive + 
                      0.3 * reboundsDefensive + 
                      steals + 
                      0.7 * assists + 
                      0.7 * blocks - 
                      0.4 * foulsPersonal - 
                      turnovers;

    return gameScore;
}

export const calculatePIE = (player, teamStats = player.teamStats) => {
    // Destructure player stats
    const {
        points,
        fieldGoalsMade,
        freeThrowsMade,
        fieldGoalsAttempted,
        freeThrowsAttempted,
        reboundsOffensive,
        reboundsDefensive,
        assists,
        steals,
        blocks,
        turnovers
    } = player.stats;

    // Destructure game stats
    const {
        points: totalPoints,
        fieldGoalsMade: totalFieldGoalsMade,
        freeThrowsMade: totalFreeThrowsMade,
        fieldGoalsAttempted: totalFieldGoalsAttempted,
        freeThrowsAttempted: totalFreeThrowsAttempted,
        reboundsOffensive: totalReboundsOffensive,
        reboundsDefensive: totalReboundsDefensive,
        assists: totalAssists,
        steals: totalSteals,
        blocks: totalBlocks,
        turnovers: totalTurnovers
    } = teamStats;

    // Calculate missed field goals and free throws
    const fieldGoalsMissed = fieldGoalsAttempted - fieldGoalsMade;
    const freeThrowsMissed = freeThrowsAttempted - freeThrowsMade;

    // Calculate player's total contribution
    const playerContribution = points + fieldGoalsMade + freeThrowsMade - fieldGoalsMissed - freeThrowsMissed +
        reboundsOffensive + reboundsDefensive + assists + steals + blocks - turnovers;

    // Calculate game's total contribution
    const gameContribution = totalPoints + totalFieldGoalsMade + totalFreeThrowsMade -
        (totalFieldGoalsAttempted - totalFieldGoalsMade) - (totalFreeThrowsAttempted - totalFreeThrowsMade) +
        totalReboundsOffensive + totalReboundsDefensive + totalAssists +
        totalSteals + totalBlocks - totalTurnovers;

    // Calculate PIE
    const PIE = playerContribution / gameContribution;

    return PIE;
}

export const getBestStats = (stats, N) => {

    const statWeights = {
        points: 5,
        assists: 4,
        reboundsTotal: 4,
        steals: 3,
        blocks: 3,
        fieldGoalsPercentage: 5,
        threePointersPercentage: 5,
        threePointersMade: 3,
        turnovers: -2,
    };

    const statNames = {
        points: 'PTS',
        assists: 'AST',
        reboundsTotal: 'REB',
        steals: 'STL',
        blocks: 'BLK',
        fieldGoalsPercentage: 'FG%',
        threePointersPercentage: '3P%',
        threePointersMade: '3PT',
        turnovers: 'TO',
    }

    const percentageStats = new Set(['fieldGoalsPercentage', 'threePointersPercentage']);

    // Calculate impressiveness score for each stat
    let scores = [];

    for (let stat in stats) {
        if (statWeights.hasOwnProperty(stat) && statNames.hasOwnProperty(stat)) {
            const isPercentage = percentageStats.has(stat);
            const displayValue = isPercentage ? stats[stat] * 100 : stats[stat];
            let score = displayValue * statWeights[stat];
            scores.push({
                name: statNames[stat],
                score: score,
                value: isPercentage ? `${displayValue.toFixed(1)}%` : displayValue
            });
        }
    }

    // Sort the stats by impressiveness score in descending order
    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, N);
}
