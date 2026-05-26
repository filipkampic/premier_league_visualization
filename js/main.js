import { assignRounds } from "./utils/rounds.js";
import { drawBarChart } from "./charts/bar.js";
import { drawLineChart } from "./charts/line.js";
import { drawScatterPlot } from "./charts/scatter.js";
import { drawDonutChart } from "./charts/donut.js";
import { drawSpiderChart } from "./charts/spider.js";

let globalData = [];
let currentSeason = null;
let currentRound = 1;

d3.csv("data/combined.csv").then(data => {
    globalData = assignRounds(data);

    initSeasonSelect();
    initRoundSlider();
    initTeamSelect(getSeasonData());
    initTeamButtons();
    
    updateVisualizations();
});

function initSeasonSelect() {
    const select = document.getElementById("season-select");
    const seasons = [...new Set(globalData.map(d => d.season))];

    seasons.forEach(season => {
        const option = document.createElement("option");
        option.value = season;
        option.textContent = season;
        select.appendChild(option);
    });

    currentSeason = seasons[seasons.length - 1];
    select.value = currentSeason;
    updateSliderMax();

    select.addEventListener("change", () => {
        currentSeason = select.value;
        updateSliderMax();
        initTeamSelect(getSeasonData());
        updateVisualizations();
    })
}

function initRoundSlider() {
    const slider = document.getElementById("round-slider");
    const value = document.getElementById("round-value");


    slider.addEventListener("input", () => {
        currentRound = Number(slider.value);
        value.textContent = currentRound;
        updateBarChart();
    });
}

function initTeamSelect(seasonData) {
    const container = document.getElementById("team-list");
    container.innerHTML = "";

    const teams = [...new Set([
        ...seasonData.map(d => d.HomeTeam),
        ...seasonData.map(d => d.AwayTeam)
    ])].sort();

    const defaults = ["Man City", "Liverpool", "Arsenal", "Chelsea", "Man United"];

    teams.forEach(team => {
        const row = document.createElement("div");
        row.className = "team-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = team;
        checkbox.checked = defaults.includes(team);

        checkbox.addEventListener("change", updateLineChart);

        const label = document.createElement("span");
        label.textContent = team;

        row.appendChild(checkbox);
        row.appendChild(label);
        container.appendChild(row);
    });
}

function updateSliderMax() {
    const seasonData = getSeasonData();
    const maxRound = d3.max(seasonData, d => d.Round);
    const slider = document.getElementById("round-slider");
    slider.max = maxRound;
    slider.value = maxRound;
    currentRound = maxRound;
    document.getElementById("round-value").textContent = currentRound;
}

function getSeasonData() {
    return globalData.filter(d => d.season === currentSeason);
}

function updateVisualizations() {
    const seasonData = getSeasonData();

    updateBarChart();
    updateLineChart();
    drawScatterPlot(seasonData);
    drawDonutChart(seasonData);
    drawSpiderChart(seasonData);
}

function updateBarChart() {
    const seasonData = getSeasonData();
    const dataUpToRound = seasonData.filter(d => d.Round <= currentRound);

    drawBarChart(dataUpToRound, currentRound, seasonData);
}

function getLineChartData(seasonData) {
    const teams = [...new Set([
        ...seasonData.map(d => d.HomeTeam),
        ...seasonData.map(d => d.AwayTeam)
    ])];

    const result = {};
    teams.forEach(team => result[team] = []);

    const maxRound = d3.max(seasonData, d => Number(d.Round));

    teams.forEach(team => {
        let points = 0;

        for (let round = 1; round <= maxRound; round++) {
            const matches = seasonData.filter(m => Number(m.Round) === round);

            matches.forEach(m => {
                if (m.HomeTeam === team) {
                    if (m.FTR === "H") points += 3;
                    else if (m.FTR === "D") points += 1;
                }
                if (m.AwayTeam === team) {
                    if (m.FTR === "A") points += 3;
                    else if (m.FTR === "D") points += 1;
                }
            });

            result[team].push({ round, points });
        }
    });

    for (let round = 1; round <= maxRound; round++) {
        const standings = teams
            .map(team => ({
                team,
                points: result[team][round - 1].points
            }))
            .sort((a, b) => b.points - a.points);
        
        standings.forEach((entry, index) => {
            result[entry.team][round - 1].position = index + 1;
        });
    }

    return result;
}

function updateLineChart() {
    const seasonData = getSeasonData();
    const lineData = getLineChartData(seasonData);

    const selectedTeams = [...document.querySelectorAll("#team-list input:checked")]
        .map(cb => cb.value);

    drawLineChart(lineData, selectedTeams);
}

function initTeamButtons() {
    document.getElementById("reset-teams").addEventListener("click", () => {
        const defaults = ["Man City", "Liverpool", "Arsenal", "Chelsea", "Man United"];

        document.querySelectorAll("#team-list input[type='checkbox']").forEach(cb => {
            cb.checked = defaults.includes(cb.value);
        });

        updateLineChart();
    });

    document.getElementById("select-all-teams").addEventListener("click", () => {
        document.querySelectorAll("#team-list input[type='checkbox']").forEach(cb => {
            cb.checked = true;
        });

        updateLineChart();
    });
}
