import logging

COLOR_MAP = {
    logging.DEBUG: "\033[94m",    # Blue
    logging.INFO: "\033[92m",     # Green
    logging.WARNING: "\033[93m",  # Yellow
    logging.ERROR: "\033[91m",    # Red
    logging.CRITICAL: "\033[95m", # Magenta
}
RESET = "\033[0m"


class ColorFormatter(logging.Formatter):
    def format(self, record):
        log_fmt = f"{COLOR_MAP.get(record.levelno, '')}%(asctime)s - %(levelname)s - %(name)s - %(message)s{RESET}"
        formatter = logging.Formatter(log_fmt)
        return formatter.format(record)


def get_logger(name: str = "default_logger") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    if not logger.handlers:
        # Console handler
        ch = logging.StreamHandler()
        ch.setLevel(logging.DEBUG)

        # Formatter
        ch.setFormatter(ColorFormatter())

        logger.addHandler(ch)
        logger.propagate = False

    return logger
