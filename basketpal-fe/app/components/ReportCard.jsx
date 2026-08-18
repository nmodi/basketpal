import ResearchLog from './ResearchLog';
import styles from './ReportCard.module.css';

/**
 * The AI report card shared by the pregame preview and the postgame recap:
 * label, headline, body paragraphs, and the research trace. `report` is
 * undefined while generating (skeleton) and null when generation failed.
 * Anything passed as children renders between the body and the trace.
 */
export default function ReportCard({ label, report, body, skeletonLines = 6, unavailable, children }) {
    return (
        <div className={styles.card}>
            <p className={styles.label}>{label}</p>
            {report === undefined ? (
                <>
                    <div className={styles.skeletonTitle} />
                    {Array.from({ length: skeletonLines }).map((_, i) => (
                        <div key={i} className={styles.skeletonLine} style={{ width: i % 3 === 2 ? '60%' : '100%' }} />
                    ))}
                </>
            ) : report ? (
                <>
                    <h2 className={styles.headline}>{report.headline}</h2>
                    <div className={styles.body}>
                        {body.split('\n').filter(Boolean).map((p, i) => (
                            <p key={i} className={styles.paragraph}>{p}</p>
                        ))}
                    </div>
                    {children}
                    {report.researchLog?.length > 0 && <ResearchLog log={report.researchLog} />}
                </>
            ) : (
                <p className={styles.unavailable}>{unavailable}</p>
            )}
        </div>
    );
}
