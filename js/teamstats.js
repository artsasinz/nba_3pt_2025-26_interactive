export class TeamStats {
    constructor(teams) {
        this.teams = teams;
    }

    getTeamCount() {
        return this.teams.length;
    }

    // getAverage3PT() {
    //     if (this.teams.length === 0) {
    //         return 0;
    //     }

    //     const total = this.teams.reduce(function(sum, player) {
    //         return sum + Number(team.FG3_PCT);
    //     }, 0);

    //     return total / this.players.length;
    // }

    calculateMedian(sortedValues) {
        if (sortedValues.length === 0) {
            return 0;
        }

        const middle = Math.floor(sortedValues.length / 2);

        if (sortedValues.length % 2 === 0) {
            return (sortedValues[middle - 1] + sortedValues[middle]) / 2;
        }

        return sortedValues[middle];
    }

    getMedianMetric(metric, mode= "perSeason") {
        const values = this.teams
            .map(function(team) {
                const value = Number(team[metric]);

                if (metric === "FG3_PCT" || metric === "W_PCT") {
                    return value * 100;
                }

                if (mode === "perGame" && (metric === "FG3A" || metric === "FG3M")) {
                    return value / 82;
                }

                return value;
            })
            .sort((a, b) => a - b);

        return this.calculateMedian(values);
    }

    getBest3PTTeam() {
        if (this.teams.length === 0) {
            return null;
        }

        return this.teams.reduce(function(best, team) {
            return Number(team.FG3_PCT) > Number(best.FG3_PCT)
                ? team
                : best;
        });
    }
}