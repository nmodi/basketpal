import { Link } from '@remix-run/react';
import styles from './ErrorPage.module.css';

const COPY = {
    notFound: {
        title: 'NOT FOUND',
        message: "We couldn't find that game or page.",
    },
    client: {
        title: 'SOMETHING WENT WRONG',
        message: "That request couldn't be completed.",
    },
    server: {
        title: 'SERVICE UNAVAILABLE',
        message: 'The stats service is having trouble right now. Please try again in a moment.',
    },
};

function copyForStatus(status) {
    if (status === 404) return COPY.notFound;
    if (status >= 500) return COPY.server;
    return COPY.client;
}

const ErrorPage = ({ status = 500 }) => {
    const { title, message } = copyForStatus(status);

    return (
        <div className={styles.page}>
            <p className={styles.statusCode}>{status}</p>
            <p className={styles.title}>{title}</p>
            <p className={styles.message}>{message}</p>
            <div className={styles.actions}>
                <button
                    className={styles.btnPrimary}
                    onClick={() => { if (typeof window !== 'undefined') window.location.reload(); }}
                >
                    Try again
                </button>
                <Link to="/" className={styles.btnSecondary}>
                    ← Schedule
                </Link>
            </div>
        </div>
    );
};

export default ErrorPage;
