import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import styles from './GamePreview.module.css';
import { getTeamStyle } from '../util/teamColorStrategy';
import { getTeamByTricode } from '../util/settings';
import ReportCard from './ReportCard';

dayjs.extend(relativeTime);

function statusBadge(status) {
    if (!status) return { label: '—', cls: styles.badgeProbable };
    const s = status.toLowerCase();
    if (s === 'out') return { label: 'OUT', cls: styles.badgeOut };
    if (s.includes('question') || s.includes('day-to-day') || s.includes('day to day'))
        return { label: 'QUEST.', cls: styles.badgeQuest };
    if (s === 'probable') return { label: 'PROBABLE', cls: styles.badgeProbable };
    return { label: status.toUpperCase(), cls: styles.badgeProbable };
}

function InjuryTeamSection({ tricode, players }) {
    const dotColor = getTeamStyle(tricode).barColor;
    const team = getTeamByTricode(tricode);
    const teamLabel = team ? team.name.split(' ').pop() : tricode;
    return (
        <div className={styles.teamSection}>
            <div className={styles.teamHeader}>
                <span className={styles.teamDot} style={{ background: dotColor }} />
                <span>{teamLabel} · {players.length} LISTED</span>
            </div>
            {players.map((p, i) => {
                const { label, cls } = statusBadge(p.status);
                return (
                    <div key={i} className={styles.playerRow}>
                        <div>
                            <span className={styles.playerName}>{p.player_name}</span>
                            {p.injury_type && <span className={styles.playerInjury}> {p.injury_type}</span>}
                        </div>
                        <span className={`${styles.statusBadge} ${cls}`}>{label}</span>
                    </div>
                );
            })}
        </div>
    );
}

export default function GamePreview({ gameData, preview, injuries }) {
    const gameTime = dayjs().isAfter(dayjs(gameData.gameTimeUTC))
        ? 'any minute now...'
        : dayjs(gameData.gameTimeUTC).fromNow();

    const showInjuries = injuries && (injuries.home?.players?.length > 0 || injuries.away?.players?.length > 0);

    return (
        <div className={styles.container}>
            <div className={styles.layout}>
                <div className={styles.summaryCol}>
                    <ReportCard
                        label="Pregame Summary"
                        report={preview}
                        body={preview?.preview}
                        skeletonLines={5}
                        unavailable="Preview unavailable"
                    />
                </div>

                {showInjuries && (
                    <div className={styles.injuryCol}>
                        <div className={styles.injuryPanel}>
                            <p className={styles.injuryTitle}>Injury Report</p>
                            {injuries.away?.players?.length > 0 && (
                                <InjuryTeamSection tricode={injuries.away.tricode} players={injuries.away.players} />
                            )}
                            {injuries.home?.players?.length > 0 && (
                                <InjuryTeamSection tricode={injuries.home.tricode} players={injuries.home.players} />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
