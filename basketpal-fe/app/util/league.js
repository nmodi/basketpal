export const League = {
    NBA: "NBA",
    WNBA: "WNBA"
}

export const getLeague = (gameId) => {
    return gameId.startsWith("00") ? League.NBA : League.WNBA;
}
