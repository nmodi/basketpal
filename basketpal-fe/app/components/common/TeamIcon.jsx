import { Image } from "@chakra-ui/react";

import { League } from '../../util/league';

const TeamIcon = ({teamId, league}) => {

    let src = league === League.NBA ?
        `https://cdn.nba.com/logos/nba/${teamId}/primary/L/logo.svg` :
        `https://cdn.wnba.com/logos/wnba/${teamId}/primary/D/logo.svg`

    return (
        <Image
            src={src}
            w="16px"
        />
    )
}

export default TeamIcon;