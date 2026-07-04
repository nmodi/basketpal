import { getGameResult, getTopPlayers, evaluateKeysToTheWin } from '../util/gameUtils';
import { getBestStats } from '../util/statFunctions';
import PlayerImage from './common/PlayerImage';
import { getTeamById } from '../util/settings';
import styles from './Postgame.module.css';

const KEY_STAT_META = {
    assists: { title: 'Ball Movement', unit: 'AST' },
    benchPoints: { title: 'Bench Production', unit: 'Bench pts' },
    reboundsOffensive: { title: 'Offensive Glass', unit: 'OREB' },
    reboundsTotal: { title: 'Rebounding', unit: 'REB' },
    steals: { title: 'Steals', unit: 'STL' },
    blocks: { title: 'Rim Protection', unit: 'BLK' },
    fieldGoalsPercentage: { title: 'Shooting Efficiency', unit: 'FG%', pct: true },
    freeThrowsAttempted: { title: 'Getting to the Line', unit: 'FTA' },
    fastBreakPointsMade: { title: 'Fast Break', unit: 'FB pts' },
    freeThrowsPercentage: { title: 'Free Throw Shooting', unit: 'FT%', pct: true },
    threePointersPercentage: { title: '3-Point Shooting', unit: '3P%', pct: true },
    threePointersMade: { title: '3-Point Volume', unit: '3PM' },
    turnovers: { title: 'Ball Security', unit: 'TO', lowerIsBetter: true },
};

const fmtPct = (frac) => `${Number((frac * 100).toFixed(1))}%`;

export default function Postgame({ gameData, summary, league }) {
    const { winningTeam, losingTeam } = getGameResult(gameData);
    const potg = getTopPlayers(winningTeam, 1)[0];
    const s = potg.stats;
    const keys = evaluateKeysToTheWin(winningTeam, losingTeam, 4);

    const teamColors = getTeamById(league, winningTeam.teamId);

    const maxPoints = Math.max(
        ...[...gameData.homeTeam.players, ...gameData.awayTeam.players].map(p => p.stats?.points ?? 0)
    );
    const secondStat = getBestStats(s, 4).find(b => b.name !== 'PTS');

    const shooting = [
        { label: 'Field Goals', made: s.fieldGoalsMade, att: s.fieldGoalsAttempted },
        { label: '3-Point', made: s.threePointersMade, att: s.threePointersAttempted },
        { label: 'Free Throws', made: s.freeThrowsMade, att: s.freeThrowsAttempted },
    ];

    return (
        <div className={styles.grid}>
            <div className={styles.topRow}>
                {/* left: game story */}
                <div className={styles.storyCard}>
                    <p className={styles.storyLabel}>Game Story</p>
                    {summary === undefined ? (
                        <>
                            <div className={styles.skeletonTitle} />
                            {Array.from({ length: 7 }).map((_, i) => (
                                <div key={i} className={styles.skeletonLine} style={{ width: i % 3 === 2 ? '60%' : '100%' }} />
                            ))}
                        </>
                    ) : summary ? (
                        <>
                            <h2 className={styles.storyTitle}>{summary.headline}</h2>
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

                {/* right: potg */}
                <div
                    className={styles.potgCard}
                    style={teamColors && { '--team-c1': teamColors.c1, '--team-c2': teamColors.c2 }}
                >
                    <div className={styles.potgHeader}>
                        <span
                            className={styles.teamChip}
                            style={teamColors && { background: teamColors.c1, color: teamColors.c2 }}
                        >
                            {winningTeam.teamTricode}
                        </span>
                        <span className={styles.potgHeaderTitle}>Player of the Game</span>
                    </div>

                    <div className={styles.potgHero}>
                        <div
                            className={styles.potgPhoto}
                            style={teamColors && { background: `linear-gradient(135deg, ${teamColors.c1}, var(--bg-sunken))` }}
                        >
                            <PlayerImage
                                league={league}
                                playerId={potg.playerId}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div>
                            <p className={styles.potgMeta}>
                                {[potg.position, potg.jerseyNum && `#${potg.jerseyNum}`].filter(Boolean).join(' · ')}
                            </p>
                            <p className={styles.potgName}>{potg.name}</p>
                            <div className={styles.badges}>
                                <span className={`${styles.badge} ${styles.badgeHot}`}>
                                    🚀 {s.points === maxPoints ? `Game-high ${s.points} pts` : `${s.points} pts`}
                                </span>
                                {secondStat && (
                                    <span className={styles.badge}>
                                        {['STL', 'BLK'].includes(secondStat.name) ? '🔒' : '🎯'} {secondStat.value} {secondStat.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.statRow}>
                        {[
                            { v: s.points, l: 'PTS' },
                            { v: s.reboundsTotal, l: 'REB' },
                            { v: s.steals, l: 'STL' },
                            { v: s.assists, l: 'AST' },
                        ].map(cell => (
                            <div key={cell.l} className={styles.statCell}>
                                <p className={styles.statValue}>{cell.v}</p>
                                <p className={styles.statLabel}>{cell.l}</p>
                            </div>
                        ))}
                        <div className={styles.statCell}>
                            <p className={`${styles.statValue} ${styles.plusMinus}`}>
                                {s.plusMinusPoints > 0 ? `+${s.plusMinusPoints}` : s.plusMinusPoints}
                            </p>
                            <p className={styles.statLabel}>+/-</p>
                        </div>
                    </div>

                    <div className={styles.shooting}>
                        {shooting.map(row => {
                            const pct = row.att ? row.made / row.att : 0;
                            return (
                                <div key={row.label} className={styles.shootingRow}>
                                    <span className={styles.shootingLabel}>{row.label}</span>
                                    <div className={styles.shootingBar}>
                                        <div className={styles.shootingFill} style={{ width: `${pct * 100}%` }} />
                                    </div>
                                    <span className={styles.shootingFrac}>{row.made} / {row.att}</span>
                                    <span className={styles.shootingPct}>{fmtPct(pct)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* keys to the win - horizontal */}
            <div>
                <h3 className={styles.keysHeading}>Keys to the Win</h3>
                <div className={styles.keysRow}>
                    {Object.keys(keys.winningTeamTopStats).map(stat => {
                        const meta = KEY_STAT_META[stat] ?? { title: stat, unit: '' };
                        const w = keys.winningTeamTopStats[stat];
                        const l = keys.losingTeamTopStats[stat];
                        const diff = w - l;
                        const sign = diff > 0 ? '+' : '';
                        const total = w + l;
                        const winShare = total ? (meta.lowerIsBetter ? l : w) / total : 0.5;
                        return (
                            <div key={stat} className={styles.keyCard}>
                                <div className={styles.keyTop}>
                                    <span className={styles.keyTitle}>{meta.title}</span>
                                    <div className={styles.keyDiff}>
                                        <p className={styles.keyDiffValue}>
                                            {meta.pct ? `${sign}${Number((diff * 100).toFixed(1))}%` : `${sign}${diff}`}
                                        </p>
                                        <p className={styles.keyDiffUnit}>{meta.unit}</p>
                                    </div>
                                </div>
                                <div className={styles.keyCompare}>
                                    <span className={styles.keyTeamWin}>
                                        {winningTeam.teamTricode} {meta.pct ? fmtPct(w) : w}
                                    </span>
                                    <div className={styles.keyBar}>
                                        <div className={styles.keyBarFill} style={{ width: `${winShare * 100}%` }} />
                                    </div>
                                    <span className={styles.keyTeamLose}>
                                        {losingTeam.teamTricode} {meta.pct ? fmtPct(l) : l}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
