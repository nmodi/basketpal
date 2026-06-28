import { Trophy } from '@phosphor-icons/react';
import { useNavigate } from "@remix-run/react";
import dayjs from 'dayjs';
import { getTeamStyle } from '../util/teamColorStrategy';
import { getLeague } from '../util/league';
import styles from './Microtron.module.css';

function getCountdownLabel(gameTimeUTC) {
    const gameTime = new Date(gameTimeUTC);
    const diffMs = gameTime.getTime() - Date.now();
    if (diffMs <= 0) return 'STARTING SOON';

    const isToday = new Date().toDateString() === gameTime.toDateString();
    if (!isToday) return 'SCHEDULED';

    const totalMin = Math.floor(diffMs / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h > 0 ? `STARTS IN ${h}H ${m}M` : `STARTS IN ${m}M`;
}

function formatGameClock(gameClock) {
    if (!gameClock) return null;
    const match = /^PT(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(gameClock);
    if (!match) return null;
    const minutes = Number.parseInt(match[1] ?? '0', 10);
    const seconds = Math.floor(Number.parseFloat(match[2] ?? '0'));
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getScoreOpacity(teamScore, otherTeamScore) {
    if (teamScore == null || otherTeamScore == null) return 1;
    if (teamScore > otherTeamScore) return 1;
    if (teamScore < otherTeamScore) return 0.45;
    return 0.7;
}

function getScoreColor(teamScore, otherTeamScore, isFinal) {
    if (!isFinal) return 'var(--chyron-fg)';
    if (teamScore == null || otherTeamScore == null) return 'var(--chyron-fg)';
    if (teamScore > otherTeamScore) return 'var(--highlight)';
    if (teamScore < otherTeamScore) return 'var(--fg-muted)';
    return 'var(--chyron-fg)';
}

function TeamPanel({ team, align, isScheduled, isWinner, scoreColor, scoreOpacity, teamStyle }) {
    const isRight = align === 'right';
    const isLong = team.teamName.length > 8;

    return (
        <div className={`${styles.teamPanel} ${isRight ? styles.teamPanelRight : styles.teamPanelLeft}`}>
            <div className={styles.teamContent}>
                <p className={`${styles.teamName} ${isLong ? styles.teamNameLong : ''}`} style={{ color: teamStyle.nameColor }}>
                    {isWinner && isRight && <Trophy className={styles.trophy} weight="fill" />}
                    <span className={styles.teamNameText}>{team.teamName}</span>
                    {isWinner && !isRight && <Trophy className={styles.trophy} weight="fill" />}
                </p>
                {team.wins != null && team.losses != null && (
                    <p className={styles.record}>{team.wins}–{team.losses}</p>
                )}
            </div>
            <div className={`${styles.scoreBox} ${isRight ? styles.scoreBoxRight : styles.scoreBoxLeft}`}>
                <p className={styles.scoreText} style={{ color: scoreColor, opacity: isScheduled ? 0.4 : scoreOpacity }}>
                    {isScheduled ? '—' : (team.score ?? '--')}
                </p>
            </div>
        </div>
    );
}

export default function Microtron({ game }) {
    const navigate = useNavigate();
    const isScheduled = game.gameStatus === 1;
    const isLive = game.gameStatus === 2;
    const isFinal = game.gameStatus === 3;
    const gameTime = dayjs(game.gameTimeUTC).format('h:mm A');
    const awayStyle = getTeamStyle(game.awayTeam.teamTricode);
    const homeStyle = getTeamStyle(game.homeTeam.teamTricode);
    const formattedClock = formatGameClock(game.gameClock);
    const awayScoreColor = getScoreColor(game.awayTeam.score, game.homeTeam.score, isFinal);
    const homeScoreColor = getScoreColor(game.homeTeam.score, game.awayTeam.score, isFinal);
    const awayScoreOpacity = isLive || isFinal ? 1 : getScoreOpacity(game.awayTeam.score, game.homeTeam.score);
    const homeScoreOpacity = isLive || isFinal ? 1 : getScoreOpacity(game.homeTeam.score, game.awayTeam.score);

    return (
        <div
            className={styles.card}
            onClick={() => navigate(`/${getLeague(game.gameId).toLowerCase()}/g/${game.gameId}`)}
        >
            <div className={`${styles.colorBar} ${styles.colorBarLeft}`} style={{ background: awayStyle.barColor }} />
            <div className={`${styles.colorBar} ${styles.colorBarRight}`} style={{ background: homeStyle.barColor }} />

            <div className={styles.body}>
                <TeamPanel
                    team={game.awayTeam}
                    align="left"
                    isScheduled={isScheduled}
                    isWinner={isFinal && game.awayTeam.score > game.homeTeam.score}
                    scoreColor={awayScoreColor}
                    scoreOpacity={awayScoreOpacity}
                    teamStyle={awayStyle}
                />

                <div className={styles.center}>
                    <p className={styles.matchup}>{game.awayTeam.teamTricode} @ {game.homeTeam.teamTricode}</p>
                    {isScheduled && (
                        <>
                            <p className={styles.gameTime}>{gameTime.replace(/\s?(AM|PM)$/i, ' ET')}</p>
                            <p className={styles.countdown}>{getCountdownLabel(game.gameTimeUTC)}</p>
                        </>
                    )}
                    {isLive && (
                        <>
                            <span className={styles.liveBadge}>LIVE</span>
                            <div className={styles.liveInfo}>
                                <span>Q{game.period ?? '-'}</span>
                                <span className={styles.liveSep}>•</span>
                                <span>{formattedClock ?? 'LIVE'}</span>
                            </div>
                        </>
                    )}
                    {isFinal && (
                        <div className={styles.finalBox}>
                            <p className={styles.finalLabel}>Final</p>
                        </div>
                    )}
                </div>

                <TeamPanel
                    team={game.homeTeam}
                    align="right"
                    isScheduled={isScheduled}
                    isWinner={isFinal && game.homeTeam.score > game.awayTeam.score}
                    scoreColor={homeScoreColor}
                    scoreOpacity={homeScoreOpacity}
                    teamStyle={homeStyle}
                />
            </div>
        </div>
    );
}
