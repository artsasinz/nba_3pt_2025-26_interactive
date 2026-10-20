import { PlayerStats } from "./playerstats.js";
import { PlayerChart } from "./playerchart.js";
import { TeamStats } from "./teamstats.js";
import { TeamChart } from "./teamchart.js";
let teamChart = null; 

console.log("NBA Dashboard JavaScript")

// Load .csv file
window.Papa.parse("nba_player_3pt_stats.csv", {
    download: true,
    header: true,

    complete: function(results) {
        // Individual stats
        const players = results.data.filter(function(player) {
            return (
                player.PLAYER_NAME &&
                Number.isFinite(Number(player.FG3_PCT)) &&
                Number.isFinite(Number(player.FG3M)) &&
                Number.isFinite(Number(player.FG3A)) &&
                Number.isFinite(Number(player.GP)) &&
                Number(player.GP) > 0
            );
        });
        console.log("Player loaded:", players)

        const playerStats = new PlayerStats(players);

        console.log("Players analyzed:", playerStats.getPlayerCount());
        console.log("player Average 3PT%:", playerStats.getAverage3PT() * 100);
        console.log("player Median attempts:", playerStats.getMedianAttempts());
        console.log("player Median 3PT%:", playerStats.getMedian3PT());

        
        // League stats
        const totalMade = players.reduce(function(sum, player) {
            return sum + Number(player.FG3M);
        }, 0);

        const totalAttempts = players.reduce(function(sum, player) {
            return sum + Number(player.FG3A);
        }, 0);

        const leagueAverage = totalAttempts > 0
            ? totalMade / totalAttempts
            : 0;

        console.log("League average 3PT%:", leagueAverage * 100);

        // 'graphPlayers' for building the graph
        const graphPlayers = players.filter(function(player) {
            return Number(player.FG3A) >= 30;
        });

        console.log("Players shown on graph(>= 30 3FGA):", graphPlayers.length);

        // Data cards
        document.getElementById("playerCount").textContent = 
            playerStats.getPlayerCount();
        document.getElementById("leagueAverage").textContent =
            (leagueAverage * 100).toFixed(2) + "%";
        document.getElementById("medianAttempts").textContent =
            playerStats.getMedianAttempts();
        document.getElementById("medianPercent").textContent =
            playerStats.getMedian3PT().toFixed(2) + "%";

        // Player Chart
        const playerChart = new PlayerChart("playerChart", graphPlayers, leagueAverage * 100);

        playerChart.createChart();

        window.Papa.parse("nba_team_3pt_stats.csv",{
            download: true,
            header: true,
            
            complete: function(teamResults) {
                const teams = teamResults.data.filter(function(team) {
                    return (
                        team.TEAM_NAME &&
                        Number.isFinite(Number(team.FG3_PCT)) &&
                        Number.isFinite(Number(team.FG3M)) &&
                        Number.isFinite(Number(team.FG3A)) &&
                        Number.isFinite(Number(team.W_PCT))
                    );
                });
                console.log("Team loaded:", teams)

                const teamStats = new TeamStats(teams);

                console.log("Teams analyzed:", teamStats.getTeamCount());
                console.log("team Median 3PT%:", teamStats.getMedianMetric("FG3_PCT"));
                console.log("team Median Win%:", teamStats.getMedianMetric("W_PCT"));
                console.log("Best 3PT Team:", teamStats.getBest3PTTeam());

                document.getElementById("teamCount").textContent =
                    teamStats.getTeamCount();
                document.getElementById("teamMedian3PT").textContent =
                    teamStats.getMedianMetric("FG3_PCT").toFixed(2)+"%";
                document.getElementById("teamMedianWinPct").textContent =
                    teamStats.getMedianMetric("W_PCT").toFixed(2);

                const bestTeam = teamStats.getBest3PTTeam();  
                if (bestTeam) {
                    const bestPCT = (Number(bestTeam.FG3_PCT) * 100).toFixed(1);
                    document.getElementById("top3PTTeam").textContent =
                        `${bestTeam.TEAM_NAME} (${bestPCT}%)`;
                }

                teamChart = new TeamChart("teamChart", teams, players);
                teamChart.createChart();
                    
            }
        })
    }
})

// ==== PAGE SWITCHING ====
const teamViewButton = document.getElementById("teamViewButton");
const playerViewButton = document.getElementById("playerViewButton");

const teamView = document.getElementById("teamView");
const playerView = document.getElementById("playerView");

teamViewButton.addEventListener("click", function() {
    teamView.classList.remove("hidden");
    playerView.classList.add("hidden");

    teamViewButton.classList.add("active");
    playerViewButton.classList.remove("active");

    if (teamChart && teamChart.chart) {
        teamChart.chart.resize();
    }
});

playerViewButton.addEventListener("click", function() {
    teamView.classList.add("hidden");
    playerView.classList.remove("hidden");

    playerViewButton.classList.add("active");
    teamViewButton.classList.remove("active");
});