import { TeamStats  } from "./teamstats.js";

const nbaColors = {
    "Atlanta Hawks": { main: "#E03A3E", border: "#C1D32F" }, 
    "Boston Celtics": { main: "#007A33", border: "#BA9653" }, 
    "Brooklyn Nets": { main: "#000000", border: "#FFFFFF" },
    "Charlotte Hornets": { main: "#1D1160", border: "#00788C" }, 
    "Chicago Bulls": { main: "#CE1141", border: "#000000" }, 
    "Cleveland Cavaliers": { main: "#860038", border: "#FDBB30" }, 
    "Dallas Mavericks": { main: "#B8C4CA", border: "#00538C" },
    "Denver Nuggets": { main: "#0E2240", border: "#FEC524" }, 
    "Detroit Pistons": { main: "#1D42BA", border: "#C8102E" },
    "Golden State Warriors": { main: "#FFC72C", border: "#1D428A" },
    "Houston Rockets": { main: "#CE1141", border: "#000000" },
    "Indiana Pacers": { main: "#002D62", border: "#FDBB30" },
    "Los Angeles Clippers": { main: "#C8102E", border: "#1D428A" },
    "Los Angeles Lakers": { main: "#FDB927", border: "#552583" },
    "Memphis Grizzlies": { main: "#5D76A9", border: "#12173F" }, 
    "Miami Heat": { main: "#98002B", border: "#000000" },
    "Milwaukee Bucks": { main: "#00471B", border: "#EEE1C6" }, 
    "Minnesota Timberwolves": { main: "#0C2340", border: "#78BE20" }, 
    "New Orleans Pelicans": { main: "#0A2240", border: "#85714D" }, 
    "New York Knicks": { main: "#F58426", border: "#006BB6" }, 
    "Oklahoma City Thunder": { main: "#007AC1", border: "#EF3B24" }, 
    "Orlando Magic": { main: "#0077C0", border: "#000000" }, 
    "Philadelphia 76ers": { main: "#006BB6", border: "#ED174C" }, 
    "Phoenix Suns": { main: "#1D1160", border: "#E56020" }, 
    "Portland Trail Blazers": { main: "#E03A3E", border: "#000000" }, 
    "Sacramento Kings": { main: "#5A2D81", border: "#63727A" }, 
    "San Antonio Spurs": { main: "#000000", border: "#C4CED4" }, 
    "Toronto Raptors": { main: "#CE1141", border: "#000000" }, 
    "Utah Jazz": { main: "#002B5C", border: "#F9A01B" },
    "Washington Wizards": { main: "#002B5C", border: "#E31837" } 
};

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

export class TeamChart {
    constructor(canvasID, teams, players) {
        this.canvasID = canvasID;
        this.teams = teams;
        this.players = players;
        this.chart = null;
        this.selectedTeamIndex = null;
        this.listenersAdded = false;
    }

    updateChart() {
        if (this.chart) {
            this.chart.destroy();
        }
        this.createChart();
    }

    getMetricValue(team, metric, mode) {
        const value = Number(team[metric]);

        if (metric === "FG3_PCT" || metric === "W_PCT") {
            return Number((value * 100).toFixed(1));
        }

        if (mode === "perGame" && (metric === "FG3A" || metric === "FG3M")) {
            return Number((value / 82).toFixed(1));
        }

        return value;
    }

    // calculateTrendline(data) {
    //     let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    //     const count = data.length;

    //     if (count === 0) return [];

    //     data.forEach(pt => {
    //         sumX += pt.x;
    //         sumY += pt.y;
    //         sumXY += (pt.x * pt.y);
    //         sumXX += (pt.x * pt.x);
    //     });

    //     const slope = (count * sumXY - sumX * sumY) / (count * sumXX - sumX * sumX);
    //     const intercept = (sumY - slope * sumX) / count;

    //     const minX = Math.min(...data.map(d => d.x));
    //     const maxX = Math.max(...data.map(d => d.x));

    //     return [
    //         { x: minX, y: slope * minX + intercept },
    //         { x: maxX, y: slope * maxX + intercept }
    //     ];
    // }

    createChart() {
        const canvas = document.getElementById(this.canvasID);
        const xMetric = document.getElementById("teamXAxis").value;
        const yMetric = document.getElementById("teamYAxis").value;
        const dataMode = document.getElementById("teamDataMode").value;
        
        const checkbox = document.getElementById("toggleTeamTrendline");
        const showTrendline = checkbox ? checkbox.checked : true;

        if (!canvas) {
            console.error("Canvas:", this.canvasID, "not found")
            return ;
        }

        const data = this.teams.map((team) => {
            return {
                x: this.getMetricValue(team, xMetric, dataMode),
                y: this.getMetricValue(team, yMetric, dataMode),
                teamName: team.TEAM_NAME,
                teamID: team.TEAM_ID,
                made: dataMode === "perGame" 
                    ? (Number(team.FG3M) / 82).toFixed(1) 
                    : Number(team.FG3M),
                attempts: dataMode === "perGame" 
                    ? (Number(team.FG3A) / 82).toFixed(1) 
                    : Number(team.FG3A),
                percentage: Number(team.FG3_PCT) * 100,
                w_PCT: (Number(team.W_PCT) * 100).toFixed(1),
            };
        });

        const team_stats = new TeamStats(this.teams);
        const medianX = team_stats.getMedianMetric(xMetric, dataMode);
        const medianY = team_stats.getMedianMetric(yMetric, dataMode);

        this.chart = new Chart(canvas, {
            type: "scatter",
            plugins: [quadrantLinesPlugin],
            data: {
                datasets: [
                    {
                        // Team's dot color
                        label: "NBA Teams",
                        data: data,
                        showLine: false,
                        trendlineLinear: showTrendline ? {
                            colorMin: "rgba(255, 99, 132, 0.8)",
                            colorMax: "rgba(85, 192, 75, 0.8)",
                            lineStyle: "dashed",
                            width: 1
                        } : null,
                        backgroundColor: (context) => {
                            if (context.dataIndex === this.selectedTeamIndex) {
                                return "rgba(255, 0, 0, 0.85)";
                            }
                            const teamName = context.raw.teamName;
                            return nbaColors[teamName]?.main || "#999999";
                        },
                        borderColor: (context) => {
                            if (context.dataIndex === this.selectedTeamIndex) {
                                return "rgba(0, 0, 0, 0.5)";
                            }
                            const teamName = context.raw.teamName;
                            return nbaColors[teamName]?.border || "#000000";
                        },
                        borderWidth: (context) => {
                            return context.dataIndex === this.selectedTeamIndex ? 3 : 1.25;
                        },
                        pointRadius: (context) => {
                            return context.dataIndex === this.selectedTeamIndex ? 7 : 4;
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

                    const index = elements[0].index;
                    const team = chart.data.datasets[0].data[index];
                    const details = document.getElementById("teamDetails");

                    // to make the dot turns red and return the data
                    this.selectedTeamIndex = index;
                    chart.update();

                    // Fallback if players array didn't load properly
                    let shootersHTML = "";
                    
                    if (this.players && this.players.length > 0) {
                        const teamPlayers = this.players.filter(p => 
                            String(p.TEAM_ID).trim() === String(team.teamID).trim()
                        );
                        
                        const topShooters = teamPlayers
                            .sort((a, b) => Number(b.FG3M) - Number(a.FG3M))
                            .slice(0, 3);

                        shootersHTML = `
                            <h4 style="margin-top: 20px; margin-bottom: 5px; font-family: Courier New; color: #444;">
                                ${team.teamName}'<br>Top 3PT Shooters:
                            </h4>
                            <table class="player-details-table" style="margin-top: 0;">
                                <tbody>
                        `;
                        
                        topShooters.forEach(p => {
                            const pct = (Number(p.FG3_PCT) * 100).toFixed(1);
                            shootersHTML += `
                                <tr>
                                    <th>${p.PLAYER_NAME}</th>
                                    <td>${p.FG3M} (${pct}%)</td>
                                </tr>
                            `;
                        });
                        shootersHTML += `</tbody></table>`;
                    }
                    //

                    details.innerHTML = `

                        <table class="player-details-table">
                            <h3>Team Detail:</h3>
                            <h2>${team.teamName}</h2>
                            <h3></h3>
                            <tbody>
                                <tr>
                                    <th>Win Game</th>
                                    <td>${Math.round((team.w_PCT / 100) * 82)}</td>
                                </tr>
                                <tr>
                                    <th>Win Percentage</th>
                                    <td>${team.w_PCT}%</td>
                                </tr>
                                <tr>
                                    <th>3PT Made</th>
                                    <td>${team.made}</td>
                                </tr>
                                <tr>
                                    <th>3PT Attempts</th>
                                    <td>${team.attempts}</td>
                                </tr>
                                <tr>
                                    <th>3PT Percentage</th>
                                    <td>${team.percentage}%</td>
                                </tr>
                                
                            </tbody>
                        </table>
                        ${shootersHTML}
                    `;
                },

                scales: {
                    x: {
                        type: "linear",
                        position: "bottom",
                        offset: true,
                        title: {
                            display: true,
                            text: document.getElementById("teamXAxis").selectedOptions[0].text,
                        }
                    },

                    y: {
                        beginAtZero: true,
                        max: yMetric === "FG3_PCT" ? 60 : undefined,
                        title: {
                            display: true,
                            text: document.getElementById("teamYAxis").selectedOptions[0].text
                        }
                    }
                },

                plugins: {
                    quadrantLines: {
                        medianX: medianX,
                        medianY: medianY,
                        xLabel: document.getElementById("teamXAxis")
                            .selectedOptions[0].text,
                        yLabel: document.getElementById("teamYAxis")
                            .selectedOptions[0].text
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const team = context.raw;

                                if (!team.teamName) {
                                    return context.dataset.label;
                                }

                                return [
                                    team.teamName,
                                    "▶ [" + context.chart.options.scales.x.title.text + ": " + team.x + "]",
                                    "▶ [" + context.chart.options.scales.y.title.text + ": " + team.y + "]",
                                    "3PT%: " + team.percentage.toFixed(1) + "%",
                                    "Win: " + Math.round((team.w_PCT / 100) * 82) + " (" + team.w_PCT + "%)",
                                ];
                            }
                        }
                    }
                }
            }
        });

        if (!this.listenersAdded) {
            document.getElementById("teamXAxis").addEventListener("change", () => {
                this.updateChart();
            });

            document.getElementById("teamYAxis").addEventListener("change", () => {
                this.updateChart();
            });

            document.getElementById("teamDataMode").addEventListener("change", () => {
                this.updateChart();
            });

            const trendCheckbox = document.getElementById("toggleTeamTrendline");
            if (trendCheckbox) {
                trendCheckbox.addEventListener("change", () => {
                    this.updateChart();
                });
            }
            
            this.listenersAdded = true;
        }
    }
}