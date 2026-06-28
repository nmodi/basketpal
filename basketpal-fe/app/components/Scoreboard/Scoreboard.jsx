import { getTeamStyle } from '../../util/teamColorStrategy';
import ScoreBreakdown from './ScoreBreakdown';
import TeamScore from './TeamScore';
import styles from './Scoreboard.module.css';

const DELAY_STEPS = [0, 10000, 30000, 45000, 60000, 90000, 120000];
const DELAY_LABELS = ['NONE', '10S', '30S', '45S', '60S', '90S', '2MIN'];
const DELAY_DISPLAY = ['None', '10s', '30s', '45s', '60s', '90s', '2 min'];

function formatGameClock(gameClock) {
    if (!gameClock) return null;
    const match = /^PT(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(gameClock);
    if (!match) return null;
    const minutes = Number.parseInt(match[1] ?? '0', 10);
    const seconds = Math.floor(Number.parseFloat(match[2] ?? '0'));
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getPeriodLabel(period) {
    if (!period) return null;
    const labels = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter', 'Overtime'];
    return labels[period - 1] ?? `${period - 4}OT`;
}

function getScoreColor(teamScore, otherTeamScore, isFinal) {
    if (!isFinal) return 'var(--chyron-fg)';
    if (teamScore == null || otherTeamScore == null) return 'var(--chyron-fg)';
    if (teamScore > otherTeamScore) return 'var(--highlight)';
    if (teamScore < otherTeamScore) return 'var(--fg-muted)';
    return 'var(--chyron-fg)';
}

export default function Scoreboard({ gameData, uiDelay, setUiDelay }) {
    const isLive = gameData.gameStatus === 2;
    const isFinal = gameData.gameStatus === 3;
    const formattedClock = formatGameClock(gameData.gameClock);

    const homeMainColor = getTeamStyle(gameData.homeTeam.teamTricode).barColor;
    const awayMainColor = getTeamStyle(gameData.awayTeam.teamTricode).barColor;

    const homeScoreColor = getScoreColor(gameData.homeTeam.score, gameData.awayTeam.score, isFinal);
    const awayScoreColor = getScoreColor(gameData.awayTeam.score, gameData.homeTeam.score, isFinal);

    const sliderIndex = DELAY_STEPS.indexOf(Number(uiDelay));
    const idx = sliderIndex === -1 ? 0 : sliderIndex;

    return (
        <div className={styles.card}>
            <div className={styles.teams}>
                <div className={styles.colorBarLeft} style={{ background: awayMainColor }} />
                <div className={styles.colorBarRight} style={{ background: homeMainColor }} />

                <TeamScore
                    team={gameData.awayTeam}
                    align="left"
                    isLive={isLive}
                    isWinner={isFinal && gameData.awayTeam.score > gameData.homeTeam.score}
                    scoreColor={awayScoreColor}
                />

                <div className={styles.center}>
                    {isLive && (
                        <>
                            <span className={styles.liveBadge}>LIVE</span>
                            <p className={styles.gameClock}>{formattedClock ?? '—'}</p>
                            <p className={styles.period}>{getPeriodLabel(gameData.period) ?? '—'}</p>
                        </>
                    )}
                    {isFinal && (
                        <div className={styles.finalBox}>
                            <p className={styles.finalLabel}>Final</p>
                        </div>
                    )}
                </div>

                <TeamScore
                    team={gameData.homeTeam}
                    align="right"
                    isHome
                    isLive={isLive}
                    isWinner={isFinal && gameData.homeTeam.score > gameData.awayTeam.score}
                    scoreColor={homeScoreColor}
                />
            </div>

            <ScoreBreakdown gameData={gameData} />

            {isLive && (
                <div className={styles.delayBar}>
                    <span className={styles.delayLabel}>Broadcast Delay</span>
                    <div className={styles.sliderWrap}>
                        <input
                            type="range"
                            className={styles.slider}
                            min={0}
                            max={DELAY_STEPS.length - 1}
                            step={1}
                            value={idx}
                            onChange={(e) => setUiDelay(DELAY_STEPS[Number(e.target.value)])}
                        />
                        <div className={styles.sliderMarks}>
                            {DELAY_LABELS.map((label) => (
                                <span key={label} className={styles.sliderMark}>{label}</span>
                            ))}
                        </div>
                    </div>
                    <span className={styles.delayValue}>{DELAY_DISPLAY[idx]}</span>
                </div>
            )}
        </div>
    );
}
