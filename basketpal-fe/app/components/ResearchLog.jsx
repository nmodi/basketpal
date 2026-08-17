import { MagnifyingGlass, CaretDown } from '@phosphor-icons/react';
import styles from './ResearchLog.module.css';

const prettify = (tool) => tool.replace(/^get_/, '').replace(/_/g, ' ');

export default function ResearchLog({ log }) {
    return (
        <details className={styles.details}>
            <summary className={styles.summary}>
                <MagnifyingGlass size={13} weight="bold" />
                <span>How this was researched</span>
                <CaretDown size={12} weight="bold" className={styles.caret} />
            </summary>
            <div className={styles.rows}>
                {log.map((entry, i) => (
                    <div key={i} className={styles.row}>
                        <span className={styles.tool}>{prettify(entry.tool)}</span>
                        {entry.args?.team && <span className={styles.badge}>{entry.args.team}</span>}
                        <span className={styles.result}>{entry.summary}</span>
                        {entry.ms > 0 && <span className={styles.ms}>{entry.ms}ms</span>}
                    </div>
                ))}
            </div>
        </details>
    );
}
