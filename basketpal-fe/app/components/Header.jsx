import { Flex, Text } from '@chakra-ui/react';
import { Link } from '@remix-run/react';

const headerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    height: '53px',
    bg: 'bg',
    borderBottom: '1px solid',
    borderColor: 'line',
    px: '6',
    align: 'center',
    justify: 'space-between',
};

const labelStyle = {
    fontSize: 'sm',
    fontWeight: 'bold',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    fontFamily: 'tt-autonomous-mono',
    color: 'fgMuted',
};

export function ScheduleHeader({ league }) {
    return (
        <Flex {...headerStyle}>
            <Text {...labelStyle} color="fg">BASKETPAL</Text>
            <Flex gap="5">
                <Link to="/?nba=1" style={{ textDecoration: 'none' }}>
                    <Text {...labelStyle} color={league === 'NBA' ? 'fg' : 'fgMuted'} _hover={{ color: 'fg' }} transition="color 0.15s">
                        NBA
                    </Text>
                </Link>
                <Link to="/wnba" style={{ textDecoration: 'none' }}>
                    <Text {...labelStyle} color={league === 'WNBA' ? 'fg' : 'fgMuted'} _hover={{ color: 'fg' }} transition="color 0.15s">
                        WNBA
                    </Text>
                </Link>
            </Flex>
        </Flex>
    );
}

export function GameHeader({ back = '/' }) {
    return (
        <Flex {...headerStyle}>
            <Link to={back} style={{ textDecoration: 'none' }}>
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
