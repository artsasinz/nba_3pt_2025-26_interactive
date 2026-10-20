export class PlayerStats {
    constructor(players) {
        this.players = players;
    }

    getPlayerCount() {
        return this.players.length;
    }

    getAverage3PT() {
        if (this.players.length === 0) {
            return 0;
        }

        const total = this.players.reduce(function(sum, player) {
            return sum + Number(player.FG3_PCT);
        }, 0);

        return total / this.players.length;
    }

    getBestPlayer() {
        if (this.players.length === 0) {
            return null;
        }

        return this.players.reduce(function(best, player) {
            return Number(player.FG3M) > Number(best.FG3M)
                ? player
                : best;
        });
    }

    getMostAttemptsPlayer() {
        if (this.players.length === 0) {
            return null;
        }

        return this.players.reduce(function(best, player) {
            return Number(player.FG3A) > Number(best.FG3A)
                ? player
                : best;
        });
    }

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

    getMedianAttempts() {
        const attempts = this.players.map(function(player) {
                return Number(player.FG3A);
            })
            .sort((a, b) => a - b);

        return this.calculateMedian(attempts);
    }

    getMedian3PT() {
        const percentages = this.players
            .map(function(player) {
                return Number(player.FG3_PCT) * 100;
            })
            .sort((a, b) => a - b);

        return this.calculateMedian(percentages);
    }

    getMedianMetric(metric, mode= "perSeason") {
        const values = this.players
            .map(function(player) {
                const value = Number(player[metric]);

                if (metric === "FG3_PCT") {
                    return value * 100;
                }

                if (mode === "perGame" && (metric === "FG3A" || metric === "FG3M")) {
                    return value / Number(player.GP);
                }

                return value;
            })
            .sort((a, b) => a - b);

        return this.calculateMedian(values);
    }

}