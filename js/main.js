import { drawBarChart } from "./charts/bar.js";
import { drawLineChart } from "./charts/line.js";
import { drawScatterPlot } from "./charts/scatter.js";
import { drawDonutChart } from "./charts/donut.js";
import { drawSpiderChart } from "./charts/spider.js";

let globalData = [];
let currentSeason = null;
let currentRound = 1;

d3.csv("data/combined.csv").then(data => {
    globalData = data;

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

    currentSeason = seasons[0];

    select.addEventListener("change", () => {
        currentSeason = select.value;
        updateVisualizations();
    })
}

function initRoundSlider() {
    const slider = document.getElementById("round-slider");
    const value = document.getElementById("round-value");

    value.textContent = currentRound;

    slider.addEventListener("input", () => {
        currentRound = Number(slider.value);
        value.textContent = currentRound;
        updateBarChart();
    });
}

function updateVisualizations() {
    const filtered = globalData.filter(d => d.season === currentSeason);

    updateBarChart();
    drawLineChart(filtered);
    drawScatterPlot(filtered);
    drawDonutChart(filtered);
    drawSpiderChart(filtered);
}

function updateBarChart() {
    const filtered  = globalData.filter(d => d.season === currentSeason);
    drawBarChart(filtered, currentRound);
}