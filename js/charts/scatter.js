import { getTeamColor } from "../utils/teamColors.js";

const margin = { top: 40, right: 40, bottom: 60, left: 60 };
const width = 700 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

let svg = null;

export function drawScatterPlot(data) {
    const teamStats = {};

    data.forEach(d => {
        if (!teamStats[d.HomeTeam]) teamStats[d.HomeTeam] = { gf: 0, ga: 0 };
        if (!teamStats[d.AwayTeam]) teamStats[d.AwayTeam] = { gf: 0, ga: 0 };

        teamStats[d.HomeTeam].gf += +d.FTHG;
        teamStats[d.HomeTeam].ga += +d.FTAG;
        teamStats[d.AwayTeam].gf += +d.FTAG;
        teamStats[d.AwayTeam].ga += +d.FTHG;
    });

    const chartData = Object.entries(teamStats).map(([team, s]) => ({
        team,
        gf: s.gf,
        ga: s.ga
    }));

    const avgGF = d3.mean(chartData, d => d.gf);
    const avgGA = d3.mean(chartData, d => d.ga);
    if (!svg) {
        svg = d3.select("#scatter-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        svg.append("g")
            .attr("class", "grid-x")
            .attr("transform", `translate(0,${height})`);

        svg.append("g")
            .attr("class", "grid-y");

        svg.append("g").attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`);

        svg.append("g").attr("class", "y-axis");

        svg.append("text")
            .attr("class", "x-label")
            .attr("x", width / 2)
            .attr("y", height + 45)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "#888")
            .text("Goals For (GF)");

        svg.append("text")
            .attr("class", "y-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -45)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "#888")
            .text("Goals Against (GA)");

        svg.append("line").attr("class", "avg-line-x");
        svg.append("line").attr("class", "avg-line-y");
    }

    let tooltip = d3.select("#scatter-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("id", "scatter-tooltip")
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("padding", "6px 10px")
            .style("border-radius", "4px")
            .style("font-size", "13px")
            .style("pointer-events", "none")
            .style("opacity", 0);
    }

    const maxVal = d3.max(chartData, d => Math.max(d.gf, d.ga)) * 1.1;

    const x = d3.scaleLinear()
        .domain([0, maxVal])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, maxVal])
        .range([0, height]);

    svg.select(".grid-x")
        .transition().duration(400)
        .call(d3.axisBottom(x).ticks(6).tickSize(-height).tickFormat(""))
        .selectAll("line").style("stroke", "#DDDDDD").style("stroke-width", 1);

    svg.select(".grid-y")
        .transition().duration(400)
        .call(d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat(""))
        .selectAll("line").style("stroke", "#DDDDDD").style("stroke-width", 1);

    svg.selectAll(".grid-x .domain, .grid-y .domain").style("display", "none");

    svg.select(".x-axis")
        .transition().duration(400)
        .call(d3.axisBottom(x).ticks(6));

    svg.select(".y-axis")
        .transition().duration(400)
        .call(d3.axisLeft(y).ticks(6));

    svg.select(".avg-line-x")
        .transition().duration(400)
        .attr("x1", x(avgGF)).attr("y1", 0)
        .attr("x2", x(avgGF)).attr("y2", height)
        .attr("stroke", "#aaa")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,4");

    svg.select(".avg-line-y")
        .transition().duration(400)
        .attr("x1", 0).attr("y1", y(avgGA))
        .attr("x2", width).attr("y2", y(avgGA))
        .attr("stroke", "#aaa")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,4");

    const dots = svg.selectAll(".dot")
        .data(chartData, d => d.team);

    const dotsEnter = dots.enter()
        .append("circle")
        .attr("class", "dot")
        .attr("r", 7)
        .attr("cx", d => x(d.gf))
        .attr("cy", d => y(d.ga))
        .attr("fill", d => getTeamColor(d.team))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);

    dotsEnter.merge(dots)
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1)
                .html(`<strong>${d.team}</strong><br>GF: ${d.gf}<br>GA: ${d.ga}`);
            d3.select(event.currentTarget)
                .attr("r", 10)
                .attr("stroke", "#333")
                .attr("stroke-width", 2);
        })
        .on("mousemove", (event) => {
            tooltip
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", (event, d) => {
            tooltip.style("opacity", 0);
            d3.select(event.currentTarget)
                .attr("r", 7)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5);
        })
        .transition().duration(500)
        .attr("cx", d => x(d.gf))
        .attr("cy", d => y(d.ga))
        .attr("fill", d => getTeamColor(d.team));

    dots.exit().remove();
}
