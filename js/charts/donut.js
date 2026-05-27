import { getTeamColor } from "../utils/teamColors.js";

const width = 400;
const height = 400;
const radius = Math.min(width, height) / 2;
const innerRadius = radius * 0.55;

let svg = null;
let currentTeam = null;

function getChampion(data) {
    const teamPoints = {};
    data.forEach(d => {
        if (!teamPoints[d.HomeTeam]) teamPoints[d.HomeTeam] = 0;
        if (!teamPoints[d.AwayTeam]) teamPoints[d.AwayTeam] = 0;
        if (d.FTR === "H") teamPoints[d.HomeTeam] += 3;
        else if (d.FTR === "A") teamPoints[d.AwayTeam] += 3;
        else { teamPoints[d.HomeTeam] += 1; teamPoints[d.AwayTeam] += 1; }
    });
    return Object.entries(teamPoints).sort((a, b) => b[1] - a[1])[0][0];
}

function getTeamWDL(data, team) {
    let w = 0, d = 0, l = 0;
    data.forEach(match => {
        if (match.HomeTeam === team) {
            if (match.FTR === "H") w++;
            else if (match.FTR === "D") d++;
            else l++;
        } else if (match.AwayTeam === team) {
            if (match.FTR === "A") w++;
            else if (match.FTR === "D") d++;
            else l++;
        }
    });
    return { w, d, l };
}

export function drawDonutChart(data) {
    const section = document.getElementById("donut-chart");

    const allTeams = [...new Set([
        ...data.map(d => d.HomeTeam),
        ...data.map(d => d.AwayTeam)
    ])].sort();

    if (!document.getElementById("donut-team-select")) {
        const controls = document.createElement("div");
        controls.className = "donut-controls";
        const label = document.createElement("label");
        label.textContent = "Club: ";
        label.htmlFor = "donut-team-select";
        const select = document.createElement("select");
        select.id = "donut-team-select";
        controls.appendChild(label);
        controls.appendChild(select);
        section.appendChild(controls);

        const inner = document.createElement("div");
        inner.className = "donut-inner";
        section.appendChild(inner);

        const svgWrapper = document.createElement("div");
        svgWrapper.id = "donut-svg-wrapper";
        svgWrapper.className = "donut-wrapper";
        inner.appendChild(svgWrapper);

        const legend = document.createElement("div");
        legend.id = "donut-legend";
        legend.className = "donut-legend";
        legend.innerHTML = `
            <div class="donut-legend-item">
                <span class="donut-legend-dot" style="background:#4CAF50"></span>
                <span>Wins</span>
            </div>
            <div class="donut-legend-item">
                <span class="donut-legend-dot" style="background:#FFC107"></span>
                <span>Draws</span>
            </div>
            <div class="donut-legend-item">
                <span class="donut-legend-dot" style="background:#E53935"></span>
                <span>Losses</span>
            </div>
        `;
        inner.appendChild(legend);
    }

    const select = document.getElementById("donut-team-select");
    select.innerHTML = "";
    allTeams.forEach(team => {
        const option = document.createElement("option");
        option.value = team;
        option.textContent = team;
        select.appendChild(option);
    });

    const champion = getChampion(data);
    currentTeam = champion;
    select.value = champion;

    select.addEventListener("change", () => {
        currentTeam = select.value;
        renderDonut(data, currentTeam);
    });

    if (!svg) {
        svg = d3.select("#donut-svg-wrapper")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        svg.append("g").attr("class", "slices");

        svg.append("circle")
            .attr("class", "logo-placeholder")
            .attr("r", innerRadius * 0.6)
            .attr("fill", "#f5f5f5")
            .attr("stroke", "#e0e0e0")
            .attr("stroke-width", 1);
    }

    renderDonut(data, currentTeam);
}

function renderDonut(data, team) {
    const { w, d, l } = getTeamWDL(data, team);
    const total = w + d + l;

    const chartData = [
        { label: "W", value: w, color: "#4CAF50" },
        { label: "D", value: d, color: "#FFC107" },
        { label: "L", value: l, color: "#E53935" }
    ];

    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius * 0.85);
    const arcHover = d3.arc().innerRadius(innerRadius).outerRadius(radius * 0.92);

    let tooltip = d3.select("#donut-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("id", "donut-tooltip")
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("padding", "6px 10px")
            .style("border-radius", "4px")
            .style("font-size", "13px")
            .style("pointer-events", "none")
            .style("opacity", 0);
    }

    const slices = svg.select(".slices")
        .selectAll("path")
        .data(pie(chartData), d => d.data.label);

    slices.enter()
        .append("path")
        .attr("fill", d => d.data.color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("d", arc)
        .merge(slices)
        .on("mouseover", (event, d) => {
            const pct = ((d.data.value / total) * 100).toFixed(1);
            const labels = { W: "Wins", D: "Draws", L: "Losses" };
            tooltip.style("opacity", 1)
                .html(`<strong>${labels[d.data.label]}</strong><br>${d.data.value} (${pct}%)`);
            d3.select(event.currentTarget)
                .transition().duration(150)
                .attr("d", arcHover);
        })
        .on("mousemove", (event) => {
            tooltip
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", (event) => {
            tooltip.style("opacity", 0);
            d3.select(event.currentTarget)
                .transition().duration(150)
                .attr("d", arc);
        })
        .attr("fill", d => d.data.color)
        .transition().duration(400)
        .attrTween("d", function(d) {
            const interpolate = d3.interpolate(
                { startAngle: d.startAngle, endAngle: d.startAngle },
                d
            );
            return t => arc(interpolate(t));
        });

    slices.exit()
        .transition().duration(200)
        .attrTween("d", function(d) {
            const interpolate = d3.interpolate(d, {
                startAngle: d.endAngle,
                endAngle: d.endAngle
            });
            return t => arc(interpolate(t));
        })
        .remove();
}
