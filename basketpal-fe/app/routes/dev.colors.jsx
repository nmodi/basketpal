import { getTeamStyle, STRATEGY_NAMES, WNBA_TRICODES, WNBA_TEAM_OVERRIDES } from '../util/teamColorStrategy';
import styles from '../styles/DevColors.module.css';

const WNBA_NAMES = {
    ATL: 'Dream', CHI: 'Sky', CON: 'Sun', DAL: 'Wings',
    IND: 'Fever', LVA: 'Aces', LA: 'Sparks', MIN: 'Lynx',
    NYL: 'Liberty', PHX: 'Mercury', SEA: 'Storm', WAS: 'Mystics', GSV: 'Valkyries', TOR: 'Tempo', PDX: 'Fire',
};

function StrategyCard({ tricode, strategy }) {
    const style = getTeamStyle(tricode, strategy);
    const current = WNBA_TEAM_OVERRIDES[tricode];
    const isActive = current === strategy || (!current && strategy === 'bold');

    return (
        <div
            className={`${styles.card} ${isActive ? styles.cardActive : ''}`}
            style={isActive ? { outline: `2px solid ${style.barColor}`, outlineOffset: '2px' } : undefined}
        >
            <div className={styles.gradient} style={{ background: style.getGradient('right') }} />
            <div className={styles.colorBar} style={{ background: style.barColor }} />
            <div className={styles.cardBody}>
                <span className={styles.strategyLabel}>{strategy}{isActive ? ' ★' : ''}</span>
                <span className={styles.teamName} style={{ color: style.nameColor }}>{WNBA_NAMES[tricode]}</span>
                <span className={styles.colorInfo}>bar: {style.barColor} · name: {style.nameColor}</span>
            </div>
        </div>
    );
}

export default function ColorPreview() {
    return (
        <div className={styles.page}>
            <p className={styles.pageTitle}>WNBA GRADIENT PREVIEW</p>
            <p className={styles.pageSubtitle}>★ = current override (or default 'bold'). Update TEAM_OVERRIDES in teamColorStrategy.js.</p>
            <div className={styles.teamList}>
                {WNBA_TRICODES.map(tricode => (
                    <div key={tricode} id={tricode}>
                        <p className={styles.teamLabel}>{tricode} — {WNBA_NAMES[tricode]}</p>
                        <div className={styles.strategyGrid}>
                            {STRATEGY_NAMES.map(strategy => (
                                <div key={strategy} className={styles.strategyWrap}>
                                    <StrategyCard tricode={tricode} strategy={strategy} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
