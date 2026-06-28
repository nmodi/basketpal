import { League } from '../../util/league';

const PlayerImage = ({playerId, league, style}) => {
    const src = league === League.NBA ?
        `https://cdn.nba.com/headshots/nba/latest/260x190/${playerId}.png` :
        `https://cdn.wnba.com/headshots/wnba/latest/260x190/${playerId}.png`;

    const fallbackSrc = league === League.NBA ?
        `https://cdn.nba.com/headshots/nba/latest/260x190/fallback.png` :
        `https://cdn.wnba.com/headshots/wnba/latest/260x190/fallback.png`;

    return (
        <img
            src={src}
            onError={(e) => { e.currentTarget.src = fallbackSrc; }}
            style={{ display: 'block', margin: '0 auto', ...style }}
            alt=""
        />
    );
};

export default PlayerImage;
