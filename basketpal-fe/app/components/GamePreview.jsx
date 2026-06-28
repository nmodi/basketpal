import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import styles from './GamePreview.module.css';

export default function GamePreview({gameData, preview}) {
    dayjs.extend(relativeTime);

    const isScheduled = dayjs(gameData.gameTimeUTC).unix() >= 0;

    const gameTime = dayjs().isAfter(dayjs(gameData.gameTimeUTC)) ?
        "any minute now..."
        : dayjs(gameData.gameTimeUTC).fromNow();

    return (
        <div className={styles.container}>
            <p className={styles.startLabel}>
                {isScheduled ? `Game starts ${gameTime}` : 'Game is not officially scheduled'}
            </p>

            {preview === undefined && (
                <div className={styles.card}>
                    <div className={styles.skeletonTitle} />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={styles.skeletonLine} style={{ width: i % 3 === 2 ? '60%' : '100%' }} />
                    ))}
                </div>
            )}

            {preview?.headline && (
                <div className={styles.card}>
                    <p className={styles.headline}>{preview.headline}</p>

                    <div className={styles.body}>
                        {preview.preview.split("\n").filter(Boolean).map((p, i) => (
                            <p key={i} className={styles.paragraph}>{p}</p>
                        ))}
                    </div>

                    {preview.playersToWatch?.length > 0 && (
                        <div className={styles.playerList}>
                            {preview.playersToWatch.map((player, i) => (
                                <p key={i} className={styles.playerNote}>
                                    {player.name} — {player.reason}
                                </p>
                            ))}
                        </div>
                    )}

                    {preview.storylines?.length > 0 && (
                        <div className={styles.storylines}>
                            {preview.storylines.map((storyline, i) => (
                                <p key={i} className={styles.playerNote}>• {storyline}</p>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
