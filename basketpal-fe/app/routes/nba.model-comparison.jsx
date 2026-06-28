import { Suspense, useEffect, useState } from 'react';
import { defer } from '@remix-run/node';
import { Await, useLoaderData, useSearchParams } from '@remix-run/react';
import axios from '../util/axios';
import styles from '../styles/ModelComparison.module.css';

const DEFAULT_GAME_ID = '0042500401';

export const meta = () => [{ title: 'Model Comparison | Basketpal' }];

export const loader = ({ request }) => {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId') || DEFAULT_GAME_ID;
    const refresh = searchParams.get('refresh') === 'true';

    const recaps = axios
        .get(`/games/${gameId}/model-comparison`, {
            params: refresh ? { refresh: true } : {},
        })
        .then((response) => response.data);

    return defer({ gameId, recaps });
};

const RecapCard = ({ recap, revealed, onToggleReveal }) => (
    <div className={styles.card}>
        <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>{recap.blindLabel}</h2>
            <button className={styles.btn} onClick={onToggleReveal}>
                {revealed ? 'Hide' : 'Reveal'}
            </button>
        </div>
        {revealed && <span className={styles.tag}>{recap.label}</span>}

        <h3 className={styles.recapHeadline}>{recap.headline}</h3>

        <div className={styles.recapBody}>
            {(recap.recap || '').split('\n').filter(Boolean).map((p, i) => (
                <p key={i} className={styles.recapParagraph}>{p}</p>
            ))}
        </div>

        {recap.keyMoments?.length > 0 && (
            <div className={styles.keyMoments}>
                {recap.keyMoments.map((moment, i) => (
                    <p key={i} className={styles.keyMoment}>
                        Q{moment.quarter}: {moment.description}
                    </p>
                ))}
            </div>
        )}

        {recap.playerOfTheGame && (
            <p className={styles.potg}>
                POTG: {recap.playerOfTheGame.name} — {recap.playerOfTheGame.reason}
            </p>
        )}
    </div>
);

const RecapGrid = ({ recaps }) => {
    const [revealed, setRevealed] = useState({});
    const [allRevealed, setAllRevealed] = useState(false);

    const toggleReveal = (blindLabel) => {
        setRevealed((prev) => ({ ...prev, [blindLabel]: !prev[blindLabel] }));
    };

    const toggleRevealAll = () => {
        setAllRevealed((prev) => !prev);
        setRevealed({});
    };

    return (
        <>
            <div className={styles.revealAllRow}>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={toggleRevealAll}>
                    {allRevealed ? 'Hide All' : 'Reveal All'}
                </button>
            </div>
            <div className={styles.grid}>
                {recaps.map((recap) => (
                    <RecapCard
                        key={recap.blindLabel}
                        recap={recap}
                        revealed={allRevealed || !!revealed[recap.blindLabel]}
                        onToggleReveal={() => toggleReveal(recap.blindLabel)}
                    />
                ))}
            </div>
        </>
    );
};

const RecapGridFallback = () => (
    <div className={styles.fallback}>
        <div className={styles.spinner} />
        <p className={styles.fallbackText}>Generating recaps from multiple models…</p>
    </div>
);

const RecapGridError = () => (
    <p className={styles.error}>Failed to generate recaps. Try regenerating.</p>
);

export default function ModelComparison() {
    const { gameId, recaps } = useLoaderData();
    const [searchParams] = useSearchParams();

    // Once the loader has consumed `refresh=true` for this load, drop it from
    // the URL so later reloads don't bypass the backend cache.
    useEffect(() => {
        if (searchParams.get('refresh') === 'true') {
            const params = new URLSearchParams(searchParams);
            params.delete('refresh');
            window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
        }
    }, []);

    const handleRefresh = () => {
        const params = new URLSearchParams(searchParams);
        params.set('refresh', 'true');
        window.location.search = params.toString();
    };

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Model Comparison</h1>
                    <p className={styles.pageSubtitle}>Game {gameId}</p>
                </div>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleRefresh}>
                    Regenerate
                </button>
            </div>

            <Suspense fallback={<RecapGridFallback />}>
                <Await resolve={recaps} errorElement={<RecapGridError />}>
                    {(resolvedRecaps) => <RecapGrid recaps={resolvedRecaps} />}
                </Await>
            </Suspense>
        </div>
    );
}
