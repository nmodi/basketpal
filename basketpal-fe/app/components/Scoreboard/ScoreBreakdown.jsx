import { getLeague } from '../../util/league';
import TeamIcon from '../common/TeamIcon';
import styles from './ScoreBreakdown.module.css';

function periodScore(scores, index) {
    if (index >= scores.length) return '–';
    return scores[index];
}

function otScore(scores) {
    if (scores.length <= 4) return '–';
    return scores.slice(4).reduce((a, b) => a + b, 0);
}

export default function ScoreBreakdown({ gameData }) {
    const { homeTeam, awayTeam } = gameData;
    const league = getLeague(gameData.gameId);

    return (
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={`${styles.th} ${styles.thLeft}`}>Team</th>
                        <th className={styles.th}>Q1</th>
                        <th className={styles.th}>Q2</th>
                        <th className={styles.th}>Q3</th>
                        <th className={styles.th}>Q4</th>
                        <th className={styles.th}>OT</th>
                        <th className={styles.th}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {[awayTeam, homeTeam].map((team) => {
                        const total = team.score ?? team.periodScores.reduce((a, b) => a + b, 0);
                        return (
                            <tr key={team.teamId}>
                                <td className={styles.tdTeam}>
                                    <div className={styles.teamCell}>
                                        <TeamIcon teamId={team.teamId} league={league} />
                                        <span className={styles.tricode}>{team.teamTricode}</span>
                                        <span className={styles.teamName}>{team.teamName}</span>
                                    </div>
                                </td>
                                {[0, 1, 2, 3].map((i) => (
                                    <td key={i} className={styles.tdPeriod}>{periodScore(team.periodScores, i)}</td>
                                ))}
                                <td className={styles.tdPeriod}>{otScore(team.periodScores)}</td>
                                <td className={styles.tdTotal}>{total}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
