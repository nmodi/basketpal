import dayjs from "dayjs";

function getGamesOnDate(date) {
    date = dayjs(date); 

    // Make service call for games on this date
    return [
        {
            gameid: '000001111',
            hteam: {
                teamid: '01',
                score: '32'
            },
            ateam: {
                teamid: '30',
                score: '56'
            }
        },
        {
            gameid: '4353',
            hteam: {
                teamid: '01',
                score: '32'
            },
            ateam: {
                teamid: '30',
                score: '56'
            }
        },
        {
            gameid: '123123',
            hteam: {
                teamid: '01',
                score: '32'
            },
            ateam: {
                teamid: '30',
                score: '56'
            }
        }
    ]; 
}

export default getSchedule; 