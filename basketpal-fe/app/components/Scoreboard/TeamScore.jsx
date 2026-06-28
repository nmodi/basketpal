import { getTeamStyle } from '../../util/teamColorStrategy';
import styles from './TeamScore.module.css';

function TimeoutDashes({ count, color }) {
    if (!count) return null;
    return (
        <div className={styles.timeouts}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={styles.timeoutDash} style={{ background: color }} />
            ))}
        </div>
    );
}

export default function TeamScore({ team, align, isHome, isLive, scoreColor }) {
    const isRight = align === 'right';
    const teamStyle = getTeamStyle(team.teamTricode);
    const isInBonus = !!team.inBonus && isLive;

    return (
        <div
            className={`${styles.panel} ${isRight ? styles.panelRight : styles.panelLeft}`}
            style={{ background: teamStyle.getGradient(isRight ? 'bottom left' : 'bottom right') }}
        >
            <p className={styles.city}>{team.teamCity}</p>
            <p className={styles.teamName} style={{ color: teamStyle.nameColor }}>
                {team.teamName}
            </p>

            <div className={`${styles.scoreRow} ${isRight ? styles.scoreRowReverse : ''}`}>
                <div className={styles.scoreBox}>
                    <p className={styles.scoreText} style={{ color: scoreColor }}>
                        {team.score ?? '—'}
                    </p>
                </div>

                <div className={`${styles.meta} ${isRight ? styles.metaRight : styles.metaLeft}`}>
                    {isLive && (
                        <TimeoutDashes count={team.timeoutsRemaining} color={teamStyle.barColor} />
                    )}
                    <p className={styles.homeAwayLabel}>{isHome ? 'Home' : 'Away'}</p>
                    {isInBonus && <span className={styles.bonusBadge}>Bonus</span>}
                </div>
            </div>
        </div>
    );
}
