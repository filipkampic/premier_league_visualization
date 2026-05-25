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

    console.log("Loaded data:", globalData);

    initSeasonSelect();
    initRoundSlider();
    
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
    drawLineChart(seasonData);
    drawScatterPlot(seasonData);
    drawDonutChart(seasonData);
    drawSpiderChart(seasonData);
}

function updateBarChart() {
    const seasonData = getSeasonData();
    const dataUpToRound = seasonData.filter(d => d.Round <= currentRound);

    drawBarChart(dataUpToRound, currentRound, seasonData);
}