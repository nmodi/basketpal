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