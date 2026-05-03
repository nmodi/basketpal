import { Flex, Text } from '@chakra-ui/react';
import { Link } from '@remix-run/react';

const headerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: '48px',
    bg: 'bg',
    borderBottom: '1px solid',
    borderColor: 'line',
    px: '6',
    align: 'center',
};

const labelStyle = {
    fontSize: 'xs',
    fontWeight: 'bold',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    fontFamily: 'tt-autonomous-mono',
    color: 'fgMuted',
};

export function ScheduleHeader() {
    return (
        <Flex {...headerStyle}>
            <Text {...labelStyle} color="fg">BASKETPAL</Text>
        </Flex>
    );
}

export function GameHeader() {
    return (
        <Flex {...headerStyle}>
            <Link to="/" style={{ textDecoration: 'none' }}>
                <Text
                    {...labelStyle}
                    _hover={{ color: 'fg' }}
                    transition="color 0.15s"
                >
                    ← SCHEDULE
                </Text>
            </Link>
        </Flex>
    );
}
