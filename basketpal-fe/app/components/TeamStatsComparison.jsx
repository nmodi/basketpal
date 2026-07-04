import TeamIcon from './common/TeamIcon';
import styles from './TeamStatsComparison.module.css';

const countingRow = (title, key, extra) => ({
    title,
    statKeys: [key],
    statFunction: (stats) => ({ formatted: stats[key], value: stats[key] }),
    ...extra,
});

const shootingRow = (title, madeKey, attemptedKey) => ({
    title,
    statKeys: [madeKey, attemptedKey],
    statFunction: (stats) => {
        const made = stats[madeKey];
        const attempted = stats[attemptedKey];
        const percentage = attempted ? ((made / attempted) * 100).toFixed(1) : '0.0';
        return { formatted: `${made} / ${attempted} (${percentage}%)`, value: parseFloat(percentage) };
    },
});

const percentageRow = (title, key) => ({
    title,
    statKeys: [key],
    statFunction: (stats) => ({ formatted: `${(stats[key] * 100).toFixed(1)}%`, value: stats[key] }),
});

const gameStatRows = [
    countingRow("Offensive Rebounds", 'reboundsOffensive'),
    countingRow("Rebounds", 'reboundsTotal'),
    countingRow("Assists", 'assists'),
    countingRow("Blocks", 'blocks'),
    countingRow("Steals", 'steals'),
    countingRow("Turnovers", 'turnovers', { isPositiveStat: false }),
    shootingRow("Shooting", 'fieldGoalsMade', 'fieldGoalsAttempted'),
    shootingRow("Free Throws", 'freeThrowsMade', 'freeThrowsAttempted'),
    shootingRow("3PT Shooting", 'threePointersMade', 'threePointersAttempted'),
    percentageRow("Field Goal %", 'fieldGoalsPercentage'),
    percentageRow("Free Throw %", 'freeThrowsPercentage'),
    percentageRow("3PT %", 'threePointersPercentage'),
    countingRow("Bench Points", 'benchPoints'),
    countingRow("Biggest Lead", 'biggestLead'),
    countingRow("Points in the Paint", 'pointsInThePaint'),
    countingRow("Fast Break Points", 'fastBreakPointsMade'),
];

export default function TeamStatsComparison({
    leftTeam,
    rightTeam,
    leftTeamStats = leftTeam.statistics,
    rightTeamStats = rightTeam.statistics,
    league
}) {
    const filteredRows = gameStatRows.filter(
        row => row.statKeys.every(key => Object.prototype.hasOwnProperty.call(leftTeamStats, key) && Object.prototype.hasOwnProperty.call(rightTeamStats, key))
    );

    return (
        <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
                <tbody>
                    <tr className={styles.header}>
                        <th></th>
                        <td>
                            <div className={styles.teamCell}>
                                <TeamIcon teamId={leftTeam.teamId} league={league} />
                                <span>{leftTeam.teamTricode}</span>
                            </div>
                        </td>
                        <td>
                            <div className={styles.teamCell}>
                                <TeamIcon teamId={rightTeam.teamId} league={league} />
                                <span>{rightTeam.teamTricode}</span>
                            </div>
                        </td>
                    </tr>
                    {filteredRows.map((row, index) => {
                        const homeStat = row.statFunction(leftTeamStats);
                        const awayStat = row.statFunction(rightTeamStats);
                        const isPositive = row.isPositiveStat ?? true;
                        const homeBetter = isPositive ? homeStat.value > awayStat.value : awayStat.value > homeStat.value;
                        const awayBetter = isPositive ? awayStat.value > homeStat.value : homeStat.value > awayStat.value;
                        return (
                            <tr key={index}>
                                <th className={styles.label}>{row.title}</th>
                                <td className={homeBetter ? styles.better : ''}>{homeStat.formatted}</td>
                                <td className={awayBetter ? styles.better : ''}>{awayStat.formatted}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
