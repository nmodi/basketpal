import { hasTripleDouble, tripleDoubleWatch, getTrueShootingPercentage } from '../util/statFunctions';
import { getLeague, League } from '../util/league';
import { NBA_TEAMS, WNBA_TEAMS } from '../util/settings';
import PlayerImage from './common/PlayerImage';
import styles from './OnCourtPlayers.module.css';

function getEmojisForStats(stats, period, teamMargin) {
    const badges = [];

    if (stats.points >= 30) badges.push({ key: 'pts-hi', emoji: '🚀', label: `${stats.points} points` });
    else if (stats.points >= 20) badges.push({ key: 'pts-mid', emoji: '📈', label: `${stats.points} points` });

    if (stats.threePointersMade > 4) badges.push({ key: '3pt', emoji: '💦', label: `${stats.threePointersMade} 3PT made` });
    if (stats.assists >= 8) badges.push({ key: 'ast', emoji: '🤝', label: `${stats.assists} assists` });
    if (stats.reboundsTotal >= 8) badges.push({ key: 'reb', emoji: '💪', label: `${stats.reboundsTotal} rebounds` });

    if (stats.foulsPersonal >= period + 1 || stats.foulsPersonal >= 4 || stats.foulsTechnical > 0) {
        badges.push({ key: 'foul', emoji: '🚨', label: `Foul trouble – ${stats.foulsPersonal} fouls, ${stats.foulsTechnical} technical` });
    }

    if (stats.turnovers > 5) badges.push({ key: 'to', emoji: '😵‍💫', label: `${stats.turnovers} turnovers` });

    const ts = getTrueShootingPercentage(stats);
    if (stats.fieldGoalsAttempted > 3 && ts > 0.6) badges.push({ key: 'hot', emoji: '🔥', label: `${Math.round(ts * 100)}% True Shooting` });
    if (stats.fieldGoalsAttempted > 3 && ts < 0.45) badges.push({ key: 'cold', emoji: '🧊', label: `${Math.round(ts * 100)}% True Shooting` });

    if (stats.blocks + stats.steals >= 4) badges.push({ key: 'def', emoji: '🔒', label: `${stats.blocks} blocks + ${stats.steals} steals` });

    if (hasTripleDouble(stats)) badges.push({ key: 'td', emoji: '📊', label: 'Triple double' });
    else if (tripleDoubleWatch(stats)) badges.push({ key: 'tdw', emoji: '👀', label: 'Triple double watch' });

    if (stats.plusMinusPoints > 5 && stats.plusMinusPoints > teamMargin + 3) {
        badges.push({ key: 'pm-hi', emoji: '🔺', label: `+${stats.plusMinusPoints} in a ${teamMargin} point game` });
    }
    if (stats.plusMinusPoints < -5 && stats.plusMinusPoints < teamMargin - 3) {
        badges.push({ key: 'pm-lo', emoji: '🔻', label: `${stats.plusMinusPoints} in a ${teamMargin} point game` });
    }

    return badges;
}

export default function OnCourtPlayers({ gameData, isHome }) {
    const league = getLeague(gameData.gameId);
    const team = isHome ? gameData.homeTeam : gameData.awayTeam;
    const otherTeam = isHome ? gameData.awayTeam : gameData.homeTeam;
    const onCourtPlayers = team.onCourtPlayers;
    const teamMargin = (team.score ?? 0) - (otherTeam.score ?? 0);
    const teams = league === League.NBA ? NBA_TEAMS : WNBA_TEAMS;
    const teamColors = teams.find(t => t.id === team.teamId);

    return (
        <div
            className={styles.container}
            style={teamColors && { '--team-c1': teamColors.c1, '--team-c2': teamColors.c2 }}
        >
            <div className={styles.teamHeader}>
                <span
                    className={styles.teamChip}
                    style={teamColors && { background: teamColors.c1, color: teamColors.c2 }}
                >
                    {team.teamTricode}
                </span>
                <p className={styles.teamHeaderTitle}>On Court</p>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={`${styles.th} ${styles.thLeft}`}>Player</th>
                        <th className={`${styles.th} ${styles.thRight}`}>PTS</th>
                        <th className={`${styles.th} ${styles.thRight}`}>REB</th>
                        <th className={`${styles.th} ${styles.thRight}`}>AST</th>
                    </tr>
                </thead>
                <tbody>
                    {onCourtPlayers.map((player) => {
                        const emojis = player.stats
                            ? getEmojisForStats(player.stats, gameData.period ?? 1, teamMargin)
                            : [];
                        return (
                            <tr key={player.playerId}>
                                <td className={styles.tdPlayer}>
                                    <div className={styles.playerCell}>
                                        <div className={styles.playerImg}>
                                            <PlayerImage league={league} playerId={player.playerId} />
                                        </div>
                                        <div className={styles.playerInfo}>
                                            <p className={styles.playerName}>
                                                {player.name}
                                                <span className={styles.jerseyNum}>#{player.jerseyNum}</span>
                                            </p>
                                            {emojis.length > 0 && (
                                                <div className={styles.emojis}>
                                                    {emojis.map(({ key, emoji, label }) => (
                                                        <span key={key} title={label}>{emoji}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.tdStat}>{player.stats?.points ?? '–'}</td>
                                <td className={`${styles.tdStat} ${styles.tdStatNormal}`}>{player.stats?.reboundsTotal ?? '–'}</td>
                                <td className={`${styles.tdStat} ${styles.tdStatNormal}`}>{player.stats?.assists ?? '–'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
