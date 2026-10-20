import { PlayerStats } from "./playerstats.js";

const quadrantLinesPlugin = { // for labeling the quadrant
    id: "quadrantLines",

    beforeDatasetsDraw(chart, args, options) {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea || !options) return;

        const { left, right, top, bottom } = chartArea;
        const x = scales.x.getPixelForValue(options.medianX);
        const y = scales.y.getPixelForValue(options.medianY);

        ctx.save();

        // Top-Left (Below Median X, Above Median Y)
        ctx.fillStyle = "rgba(255, 206, 86, 0.1)"; // Light Yellow
        ctx.fillRect(left, top, x - left, y - top);

        // Top-Right (Above Median X, Above Median Y)
        ctx.fillStyle = "rgba(85, 192, 75, 0.15)"; // Light Green
        ctx.fillRect(x, top, right - x, y - top);

        // Bottom-Left (Below Median X, Below Median Y)
        ctx.fillStyle = "rgba(255, 99, 132, 0.1)"; // Light Red
        ctx.fillRect(left, y, x - left, bottom - y);

        // Bottom-Right (Above Median X, Below Median Y)
        ctx.fillStyle = "rgba(54, 162, 235, 0.1)"; // Light Blue
        ctx.fillRect(x, y, right - x, bottom - y);

        ctx.restore();
    },

    afterDatasetsDraw(chart, args, options) {
        const { ctx, chartArea, scales } = chart;

        if (!chartArea) return;

        const { left, right, top, bottom } = chartArea;

        const x = scales.x.getPixelForValue(options.medianX);
        const y = scales.y.getPixelForValue(options.medianY);

        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 1;

        // Vertical median line
        ctx.strokeStyle = "rgba(225, 20, 20, 0.5)";
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bottom);
        ctx.stroke();

        // Horizontal median line
        ctx.strokeStyle = "rgba(11, 2, 251, 0.5)";
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(right, y);
        ctx.stroke();

        // Draw quadrant labels
        ctx.setLineDash([]);
        ctx.font = "10px Courier New";
        ctx.fillStyle = "rgba(80, 80, 80, 0.5)";

        const padding = 10;

        // Top-left: below median X, above median Y
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(
            `Below median ${options.xLabel}`,
            left + padding,
            top + padding
        );
        ctx.fillText(
            `Above median ${options.yLabel}`,
            left + padding,
            top + padding + 15
        );

        // Top-right: above median X, above median Y
        ctx.textAlign = "right";
        ctx.fillText(
            `Above median ${options.xLabel}`,
            right - padding,
            top + padding
        );
        ctx.fillText(
            `Above median ${options.yLabel}`,
            right - padding,
            top + padding + 15
        );

        // Bottom-left: below median X, below median Y
        ctx.textBaseline = "bottom";
        ctx.textAlign = "left";
        ctx.fillText(
            `Below median ${options.xLabel}`,
            left + padding,
            bottom - padding - 15
        );
        ctx.fillText(
            `Below median ${options.yLabel}`,
            left + padding,
            bottom - padding
        );

        // Bottom-right: above median X, below median Y
        ctx.textAlign = "right";
        ctx.fillText(
            `Above median ${options.xLabel}`,
            right - padding,
            bottom - padding - 15
        );
        ctx.fillText(
            `Below median ${options.yLabel}`,
            right - padding,
            bottom - padding
        );

        ctx.restore();
    }
};

export class PlayerChart {
    constructor(canvasID, players, leagueAverage) {
        this.canvasID = canvasID;
        this.players = players;
        this.leagueAverage = leagueAverage;
        this.chart = null;
        this.selectedPlayerIndex = null;
        this.listenersAdded = false;
    }

    updateChart() {
        if (this.chart) {
           this.chart.destroy(); 
        }
        this.createChart();
    }

    getMetricValue(player, metric, mode) {
        const value = Number(player[metric]);

        if (metric === "FG3_PCT") {
            return Number((value * 100).toFixed(1));
        }

        if (mode === "perGame" && (metric === "FG3A" || metric === "FG3M")) {
            return Number((value / Number(player.GP)).toFixed(1));
        }

        return value;
    }
    
    createChart() {
        const canvas = document.getElementById(this.canvasID);
        const xMetric = document.getElementById("xAxis").value;
        const yMetric = document.getElementById("yAxis").value;
        const dataMode = document.getElementById("playerDataMode").value;
        
        const checkbox = document.getElementById("togglePlayerTrendline");
        const showTrendline = checkbox ? checkbox.checked : true;
        
        if (!canvas) {
            console.error("Canvas:", this.canvasID, "not found")
            return ;
        }

        const data = this.players.map((player) => {
            return {
                x: this.getMetricValue(player, xMetric, dataMode),
                y: this.getMetricValue(player, yMetric, dataMode),
                player: player.PLAYER_NAME,
                team: player.TEAM_ABBREVIATION,
                made: dataMode === "perGame" 
                    ? (Number(player.FG3M) / Number(player.GP)).toFixed(1) 
                    : Number(player.FG3M),
                attempts: dataMode === "perGame" 
                    ? (Number(player.FG3A) / Number(player.GP)).toFixed(1) 
                    : Number(player.FG3A),
                percentage: Number(player.FG3_PCT) * 100,
                games: Number(player.GP),
                w_PCT: (Number(player.W_PCT) * 100).toFixed(1),
            };
        });

        const player_stats = new PlayerStats(this.players);
        const medianX = player_stats.getMedianMetric(xMetric, dataMode);
        const medianY = player_stats.getMedianMetric(yMetric, dataMode);

        this.chart = new Chart(canvas, {
            type: "scatter",
            plugins: [quadrantLinesPlugin],
            data: {
                datasets: [
                    {
                        // Player's dot color
                        label: "Players",
                        data: data,
                        showLine: false,
                        trendlineLinear: showTrendline ? {
                            colorMin: "rgba(255, 99, 132, 0.8)",
                            colorMax: "rgba(85, 192, 75, 0.8)",
                            lineStyle: "dashed",
                            width: 1
                        } : null,
                        backgroundColor: (context) => {
                            return context.dataIndex === this.selectedPlayerIndex
                                ? "red"
                                : "rgba(54, 162, 235, 0.3)";
                        },
                        borderColor: (context) => {
                            return context.dataIndex === this.selectedPlayerIndex
                                ? "rgba(54, 162, 235, 0.9)"
                                : "rgba(54, 162, 235, 0.6)";
                        },
                        pointRadius: (context) => {
                            return context.dataIndex === this.selectedPlayerIndex ? 5 : 3;
                        },
                        pointHoverRadius: 8
                    },
                    {
                        label: "Median " + xMetric + " (" + medianX.toFixed(1) + ")",
                        type: "line",
                        borderColor: "rgba(225, 20, 20, 0.5)",
                        borderWidth: 1,
                        borderDash: [6, 4],
                    },
                    {
                        label: "Median " + yMetric + " (" + medianY.toFixed(1) + ")",
                        type: "line",
                        borderColor: "rgba(11, 2, 251, 0.5)",
                        borderWidth: 1,
                        borderDash: [6, 4],
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                onClick: (event, elements, chart) => {
                    if (elements.length === 0) return;

                    const index = elements[0].index
                    const player = chart.data.datasets[0].data[index]
                    const details = document.getElementById("playerDetails")
                    const teamNames = {
                        ATL: "Atlanta Hawks",
                        BOS: "Boston Celtics",
                        BKN: "Brooklyn Nets",
                        CHA: "Charlotte Hornets",
                        CHI: "Chicago Bulls",
                        CLE: "Cleveland Cavaliers",
                        DAL: "Dallas Mavericks",
                        DEN: "Denver Nuggets",
                        DET: "Detroit Pistons",
                        GSW: "Golden State Warriors",
                        HOU: "Houston Rockets",
                        IND: "Indiana Pacers",
                        LAC: "Los Angeles Clippers",
                        LAL: "Los Angeles Lakers",
                        MEM: "Memphis Grizzlies",
                        MIA: "Miami Heat",
                        MIL: "Milwaukee Bucks",
                        MIN: "Minnesota Timberwolves",
                        NOP: "New Orleans Pelicans",
                        NYK: "New York Knicks",
                        OKC: "Oklahoma City Thunder",
                        ORL: "Orlando Magic",
                        PHI: "Philadelphia 76ers",
                        PHX: "Phoenix Suns",
                        POR: "Portland Trail Blazers",
                        SAC: "Sacramento Kings",
                        SAS: "San Antonio Spurs",
                        TOR: "Toronto Raptors",
                        UTA: "Utah Jazz",
                        WAS: "Washington Wizards"
                    };

                    // to make the dot turns red and return the data
                    this.selectedPlayerIndex = index;
                    chart.update();

                    details.innerHTML = `
                        
                        <table class="player-details-table">
                            <h3>Player Detail:</h3>
                            <h2>${player.player}</h2>
                            <h3></h3>
                            <tbody>
                                <tr>
                                    <th>Team</th>
                                    <td>${teamNames[player.team] || player.team}</td>
                                </tr>
                                <tr>
                                    <th>3PT Made</th>
                                    <td>${player.made}</td>
                                </tr>
                                <tr>
                                    <th>3PT Attempts</th>
                                    <td>${player.attempts}</td>
                                </tr>
                                <tr>
                                    <th>3PT Percentage</th>
                                    <td>${player.percentage.toFixed(1)}%</td>
                                </tr>
                                <tr>
                                    <th>Games Played</th>
                                    <td>${player.games}</td>
                                </tr>
                                <tr>
                                    <th>Winning Percentage</th>
                                    <td>${player.w_PCT}%</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                },

                scales: {
                    x: {
                        beginAtZero: true,
                        max: xMetric === "FG3_PCT" ? 60 : undefined,
                        max: xMetric === "GP" ? 85 : undefined,
                        type: "linear",
                        position: "bottom",
                        title: {
                            display: true,
                            text: document.getElementById("xAxis").selectedOptions[0].text
                        }
                    },

                    y: {
                        beginAtZero: true,
                        // max: Math.floor(this.leagueAverage * 2),
                        max: yMetric === "FG3_PCT" ? 60 : undefined,
                        title: {
                            display: true,
                            text: document.getElementById("yAxis").selectedOptions[0].text
                        }
                    }
                },

                plugins: {
                    quadrantLines: {
                        medianX: medianX,
                        medianY: medianY,
                        xLabel: document.getElementById("xAxis")
                            .selectedOptions[0].text,
                        yLabel: document.getElementById("yAxis")
                            .selectedOptions[0].text
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const player = context.raw;

                                if (!player.player) {
                                    return context.dataset.label;
                                }

                                return [
                                    player.player + " (" + player.team + ")",
                                    "▶ [" + context.chart.options.scales.x.title.text + ": " + player.x + "]",
                                    "▶ [" + context.chart.options.scales.y.title.text + ": " + player.y + "]",
                                    "3PT%: " + player.percentage.toFixed(1) + "%",
                                    // "Attempts: " + player.attempts,
                                    "3PT Made: " + player.made,
                                    // "Games Played: " + player.games
                                ];
                            }
                        }
                    }
                }
            }
        });

        if (!this.listenersAdded) {
            document.getElementById("xAxis").addEventListener("change", () => {
                this.updateChart();
            });

            document.getElementById("yAxis").addEventListener("change", () => {
                this.updateChart();
            });

            document.getElementById("playerDataMode").addEventListener("change", () => {
                this.updateChart();
            });

            const trendCheckbox = document.getElementById("togglePlayerTrendline");
            if (trendCheckbox) {
                trendCheckbox.addEventListener("change", () => {
                    this.updateChart();
                });
            }
        }
        this.listenersAdded = true;

    }
}