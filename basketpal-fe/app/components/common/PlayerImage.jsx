import { Image } from "@chakra-ui/react";

import { League } from '../../util/league';

const PlayerImage = ({playerId, league}) => {

    let src = league === League.NBA ?
    `https://cdn.nba.com/headshots/nba/latest/260x190/${playerId}.png` :
    `https://cdn.wnba.com/headshots/wnba/latest/260x190/${playerId}.png`

    return (
        <Image
            src={src}
            m="0 auto"
        />
    )
}

export default PlayerImage;
