import { getGameResult, getTopPlayers, evaluateKeysToTheWin } from '../util/gameUtils';
import { getBestStats } from '../util/statFunctions';
import TeamStatsComparison from './TeamStatsComparison';
import PlayerImage from './common/PlayerImage';
import styles from './Postgame.module.css';

export default function Postgame({ gameData, summary, league }) {
    const gameResult = getGameResult(gameData);
    const potg = getTopPlayers(gameResult.winningTeam, 1)[0];
    const keysToTheWin = evaluateKeysToTheWin(gameResult.winningTeam, gameResult.losingTeam, 10);

    return (
        <div className={styles.grid}>
            {/* left column */}
            <div className={styles.left}>
                {/* potg */}
                <div className={styles.card}>
                    <p className={styles.potgTitle}>Player of the Game</p>
                    <div className={styles.potgBody}>
                        <PlayerImage
                            league={league}
                            playerId={potg.playerId}
                            style={{ width: '250px', objectFit: 'contain' }}
                        />
                        <p className={styles.potgName}>{potg.name}</p>
                        <div className={styles.potgStats}>
                            {getBestStats(potg.stats, 4).map(stat => (
                                <div key={stat.name} className={styles.potgStat}>
                                    <p className={styles.potgStatValue}>{stat.value}</p>
                                    <p className={styles.potgStatName}>{stat.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* key stats */}
                <div className={styles.card}>
                    <TeamStatsComparison
                        leftTeam={gameResult.winningTeam}
                        rightTeam={gameResult.losingTeam}
                        leftTeamStats={keysToTheWin.winningTeamTopStats}
                        rightTeamStats={keysToTheWin.losingTeamTopStats}
                        league={league}
                    />
                </div>
            </div>

            {/* right column */}
            <div>
                <div className={styles.card}>
                    {summary === undefined ? (
                        <>
                            <div className={styles.skeletonTitle} />
                            {Array.from({ length: 7 }).map((_, i) => (
                                <div key={i} className={styles.skeletonLine} style={{ width: i % 3 === 2 ? '60%' : '100%' }} />
                            ))}
                        </>
                    ) : summary ? (
                        <>
                            <p className={styles.storyTitle}>{summary.headline}</p>
                            <div className={styles.storyBody}>
                                {summary.recap.split("\n").filter(Boolean).map((p, i) => (
                                    <p key={i} className={styles.storyParagraph}>{p}</p>
                                ))}
                            </div>
                            {summary.keyMoments?.length > 0 && (
                                <div className={styles.keyMoments}>
                                    {summary.keyMoments.map((moment, i) => (
                                        <p key={i} className={styles.keyMoment}>
                                            Q{moment.quarter}: {moment.description}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <p className={styles.unavailable}>Article unavailable</p>
                    )}
                </div>
            </div>
        </div>
    );
}
