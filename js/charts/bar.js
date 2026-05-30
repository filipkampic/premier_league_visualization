import { getTeamColor } from "../utils/teamColors.js";
import { getTeamLogo } from "../utils/teamLogos.js";

const margin = { top: 20, right: 30, bottom: 20, left: 44 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

let svg = null;

export function drawBarChart(data, round, allSeasonData) {
    const allTeams = [...new Set([
        ...allSeasonData.map(d => d.HomeTeam),
        ...allSeasonData.map(d => d.AwayTeam)
    ])];

    if (!svg) {
        svg = d3.select("#bar-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        svg.append("g").attr("class", "x-axis");
        svg.append("g").attr("class", "y-axis");
    }

    const teamPoints = {};
    allTeams.forEach(t => teamPoints[t] = 0);

    data.forEach(d => {
        const home = d.HomeTeam;
        const away = d.AwayTeam;
        if (!teamPoints[home]) teamPoints[home] = 0;
        if (!teamPoints[away]) teamPoints[away] = 0;

        if (d.FTR === "H") {
            teamPoints[home] += 3;
        } else if (d.FTR === "A") {
            teamPoints[away] += 3;
        } else {
            teamPoints[home] += 1;
            teamPoints[away] += 1;
        }
    });

    const chartData = Object.entries(teamPoints)
        .map(([team, points]) => ({ team, points }))
        .sort((a, b) => b.points - a.points);

    const x = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.points) || 1])
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(chartData.map(d => d.team))
        .range([0, height])
        .padding(0.3);

    svg.select(".x-axis")
        .transition().duration(400)
        .call(d3.axisTop(x).ticks(6));

    let tooltip = d3.select("#bar-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("id", "bar-tooltip")
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("padding", "6px 10px")
            .style("border-radius", "4px")
            .style("font-size", "13px")
            .style("pointer-events", "none")
            .style("opacity", 0);
    }

    const bars = svg.selectAll(".bar")
        .data(chartData, d => d.team);

    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d.team))
        .attr("height", y.bandwidth())
        .attr("width", 0)
        .attr("fill", d => getTeamColor(d.team))
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1)
                .html(`<strong>${d.team}</strong><br>Points: ${d.points}`);
            d3.select(event.currentTarget).attr("fill", d3.color(getTeamColor(d.team)).darker(0.5));
        })
        .on("mousemove", (event, d) => {
            tooltip
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", (event, d) => {
            tooltip.style("opacity", 0);
            d3.select(event.currentTarget).attr("fill", getTeamColor(d.team));
        })
        .merge(bars)
        .transition().duration(500)
        .attr("y", d => y(d.team))
        .attr("width", d => x(d.points))
        .attr("height", y.bandwidth());

    bars.exit().remove();

    const logos = svg.selectAll(".bar-logo")
        .data(chartData, d => d.team);

    logos.enter()
        .append("image")
        .attr("class", "bar-logo")
        .attr("width", 22)
        .attr("height", 22)
        .attr("x", -32)
        .attr("y", d => y(d.team) + y.bandwidth() / 2 - 11)
        .attr("href", d => getTeamLogo(d.team))
        .merge(logos)
        .transition().duration(500)
        .attr("y", d => y(d.team) + y.bandwidth() / 2 - 12);

    logos.exit().remove();

    const teamLabels = svg.selectAll(".bar-team-label")
        .data(chartData, d => d.team);

    teamLabels.enter()
        .append("text")
        .attr("class", "bar-team-label")
        .attr("y", d => y(d.team) + y.bandwidth() / 2 + 4)
        .attr("x", d => Math.max(x(d.points) - 6, 55))
        .attr("text-anchor", "end")
        .style("font-size", "12px")
        .style("fill", "#fff")
        .style("font-weight", "600")
        .style("pointer-events", "none")
        .merge(teamLabels)
        .transition().duration(500)
        .attr("y", d => y(d.team) + y.bandwidth() / 2 + 4)
        .attr("x", d => Math.max(x(d.points) - 6, 55))
        .text(d => d.team);

    teamLabels.exit().remove();

    const labels = svg.selectAll(".bar-label")
        .data(chartData, d => d.team);

    labels.enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("y", d => y(d.team) + y.bandwidth() / 2 + 4)
        .attr("x", d => x(d.points) + 4)
        .style("font-size", "12px")
        .style("fill", "#333")
        .merge(labels)
        .transition().duration(500)
        .attr("y", d => y(d.team) + y.bandwidth() / 2 + 4)
        .attr("x", d => x(d.points) + 4)
        .text(d => d.points);

    labels.exit().remove();
}