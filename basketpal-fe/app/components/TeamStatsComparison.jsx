import TeamIcon from './common/TeamIcon';
import styles from './TeamStatsComparison.module.css';

export default function TeamStatsComparison({
    leftTeam,
    rightTeam,
    leftTeamStats = leftTeam.statistics,
    rightTeamStats = rightTeam.statistics,
    league
}) {
    const gameStatRows = [
        {
            title: "Offensive Rebounds",
            statKeys: ['reboundsOffensive'],
            statFunction: (stats) => ({ formatted: stats.reboundsOffensive, value: stats.reboundsOffensive })
        },
        {
            title: "Rebounds",
            statKeys: ['reboundsTotal'],
            statFunction: (stats) => ({ formatted: stats.reboundsTotal, value: stats.reboundsTotal })
        },
        {
            title: "Assists",
            statKeys: ['assists'],
            statFunction: (stats) => ({ formatted: stats.assists, value: stats.assists })
        },
        {
            title: "Blocks",
            statKeys: ['blocks'],
            statFunction: (stats) => ({ formatted: stats.blocks, value: stats.blocks })
        },
        {
            title: "Steals",
            statKeys: ['steals'],
            statFunction: (stats) => ({ formatted: stats.steals, value: stats.steals })
        },
        {
            title: "Turnovers",
            statKeys: ['turnovers'],
            isPositiveStat: false,
            statFunction: (stats) => ({ formatted: stats.turnovers, value: stats.turnovers })
        },
        {
            title: "Shooting",
            statKeys: ['fieldGoalsMade', 'fieldGoalsAttempted'],
            statFunction: (stats) => {
                const made = stats.fieldGoalsMade;
                const attempted = stats.fieldGoalsAttempted;
                const percentage = attempted ? ((made / attempted) * 100).toFixed(1) : '0.0';
                return { formatted: `${made} / ${attempted} (${percentage}%)`, value: parseFloat(percentage) };
            }
        },
        {
            title: "Free Throws",
            statKeys: ['freeThrowsMade', 'freeThrowsAttempted'],
            statFunction: (stats) => {
                const made = stats.freeThrowsMade;
                const attempted = stats.freeThrowsAttempted;
                const percentage = attempted ? ((made / attempted) * 100).toFixed(1) : '0.0';
                return { formatted: `${made} / ${attempted} (${percentage}%)`, value: parseFloat(percentage) };
            }
        },
        {
            title: "3PT Shooting",
            statKeys: ['threePointersMade', 'threePointersAttempted'],
            statFunction: (stats) => {
                const made = stats.threePointersMade;
                const attempted = stats.threePointersAttempted;
                const percentage = attempted ? ((made / attempted) * 100).toFixed(1) : '0.0';
                return { formatted: `${made} / ${attempted} (${percentage}%)`, value: parseFloat(percentage) };
            }
        },
        {
            title: "Field Goal %",
            statKeys: ['fieldGoalsPercentage'],
            statFunction: (stats) => ({ formatted: `${(stats.fieldGoalsPercentage * 100).toFixed(1)}%`, value: stats.fieldGoalsPercentage })
        },
        {
            title: "Free Throw %",
            statKeys: ['freeThrowsPercentage'],
            statFunction: (stats) => ({ formatted: `${(stats.freeThrowsPercentage * 100).toFixed(1)}%`, value: stats.freeThrowsPercentage })
        },
        {
            title: "3PT %",
            statKeys: ['threePointersPercentage'],
            statFunction: (stats) => ({ formatted: `${(stats.threePointersPercentage * 100).toFixed(1)}%`, value: stats.threePointersPercentage })
        },
        {
            title: "Bench Points",
            statKeys: ['benchPoints'],
            statFunction: (stats) => ({ value: stats.benchPoints, formatted: stats.benchPoints })
        },
        {
            title: "Biggest Lead",
            statKeys: ['biggestLead'],
            statFunction: (stats) => ({ value: stats.biggestLead, formatted: stats.biggestLead })
        },
        {
            title: "Points in the Paint",
            statKeys: ['pointsInThePaint'],
            statFunction: (stats) => ({ value: stats.pointsInThePaint, formatted: stats.pointsInThePaint })
        },
        {
            title: "Fast Break Points",
            statKeys: ['fastBreakPointsMade'],
            statFunction: (stats) => ({ value: stats.fastBreakPointsMade, formatted: stats.fastBreakPointsMade })
        }
    ];

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
