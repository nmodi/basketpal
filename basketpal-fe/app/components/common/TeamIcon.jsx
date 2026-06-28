import { League } from '../../util/league';

const TeamIcon = ({teamId, league}) => {
    const src = league === League.NBA ?
        `https://cdn.nba.com/logos/nba/${teamId}/primary/L/logo.svg` :
        `https://cdn.wnba.com/logos/wnba/${teamId}/primary/D/logo.svg`;

    return <img src={src} width="16" alt="" />;
};

export default TeamIcon;
