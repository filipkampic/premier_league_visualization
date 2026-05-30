import { getTeamColor } from "../utils/teamColors.js";
import { getTeamLogo } from "../utils/teamLogos.js";

const width = 500;
const height = 500;
const cx = width / 2;
const cy = height / 2;
const maxRadius = 180;
const levels = 5;
const metrics = ["GF", "GA", "W", "D", "L"];
const INVERT_METRICS = ["GA", "L"];
const SPIDER_COLORS = ["#5c6bc0", "#e53935", "#43a047"];

let svg = null;
let tooltip = null;

function getTeamStats(data, team) {
    let gf = 0, ga = 0, w = 0, d = 0, l = 0;
    data.forEach(m => {
        if (m.HomeTeam === team) {
            gf += +m.FTHG;
            ga += +m.FTAG;
            if (m.FTR === "H") w++;
            else if (m.FTR === "D") d++;
            else l++;
        } else if (m.AwayTeam === team) {
            gf += +m.FTAG; 
            ga += +m.FTHG;
            if (m.FTR === "A") w++;
            else if (m.FTR === "D") d++;
            else l++;
        }
    });
    return { GF: gf, GA: ga, W: w, D: d, L: l };
}

function normalize(allStats) {
    const mins = {}, maxs = {};
    metrics.forEach(m => {
        const vals = allStats.map(s => s[m]);
        mins[m] = Math.min(...vals);
        maxs[m] = Math.max(...vals);
    });
    return allStats.map(s => {
        const norm = {};
        metrics.forEach(m => {
            const range = maxs[m] - mins[m];
            if (range === 0) {
                norm[m] = 0.5;
            } else if (INVERT_METRICS.includes(m)) {
                norm[m] = 0.2 + 0.8 * (maxs[m] - s[m]) / range;
            } else {
                norm[m] = 0.2 + 0.8 * (s[m] - mins[m]) / range;
            }
        });
        return { ...s, norm };
    });
}

function getChampion(data) {
    const pts = {};
    data.forEach(d => {
        if (!pts[d.HomeTeam]) pts[d.HomeTeam] = 0;
        if (!pts[d.AwayTeam]) pts[d.AwayTeam] = 0;
        if (d.FTR === "H") pts[d.HomeTeam] += 3;
        else if (d.FTR === "A") pts[d.AwayTeam] += 3;
        else { pts[d.HomeTeam] += 1; pts[d.AwayTeam] += 1; }
    });
    return Object.entries(pts).sort((a, b) => b[1] - a[1])[0][0];
}

function angleForMetric(i) {
    return (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
}

function pointOnAxis(i, r) {
    const angle = angleForMetric(i);
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function polygonPoints(normValues) {
    return metrics.map((m, i) => {
        const r = normValues[m] * maxRadius;
        return pointOnAxis(i, r);
    });
}

function getSelectedTeams() {
    return [1, 2, 3]
        .map(i => document.getElementById(`spider-select-${i}`)?.value)
        .filter(v => v && v !== "");
}

export function drawSpiderChart(data) {
    const section = document.getElementById("spider-chart");

    const allTeams = [...new Set([
        ...data.map(d => d.HomeTeam),
        ...data.map(d => d.AwayTeam)
    ])].sort();

    const champion = getChampion(data);

    if (!tooltip) {
        tooltip = d3.select("body").append("div")
            .attr("id", "spider-tooltip")
            .style("position", "absolute")
            .style("background", "#fff")
            .style("border", "1px solid #ccc")
            .style("padding", "6px 10px")
            .style("border-radius", "4px")
            .style("font-size", "13px")
            .style("pointer-events", "none")
            .style("opacity", 0);
    }

    if (!document.getElementById("spider-selects")) {
        const selectsWrapper = document.createElement("div");
        selectsWrapper.id = "spider-selects";
        selectsWrapper.className = "spider-selects";
        section.appendChild(selectsWrapper);

        for (let i = 1; i <= 3; i++) {
            const label = document.createElement("label");
            label.textContent = `Club ${i}: `;
            label.htmlFor = `spider-select-${i}`;
            label.className = "spider-select-label";

            const select = document.createElement("select");
            select.id = `spider-select-${i}`;
            select.className = "spider-select";
            selectsWrapper.appendChild(label);
            selectsWrapper.appendChild(select);
        }

        const svgWrapper = document.createElement("div");
        svgWrapper.id = "spider-svg-wrapper";
        section.appendChild(svgWrapper);

        const legend = document.createElement("div");
        legend.id = "spider-legend";
        legend.className = "spider-legend";
        section.appendChild(legend);
    }

    for (let i = 1; i <= 3; i++) {
        const select = document.getElementById(`spider-select-${i}`);
        select.innerHTML = '<option value="">— none —</option>';
        allTeams.forEach(team => {
            const opt = document.createElement("option");
            opt.value = team;
            opt.textContent = team;
            select.appendChild(opt);
        });
    }

    for (let i = 1; i <= 3; i++) {
        const select = document.getElementById(`spider-select-${i}`);
        const fresh = select.cloneNode(true);
        select.parentNode.replaceChild(fresh, select);
        fresh.addEventListener("change", () => {
            updateSelectOptions();
            renderPolygons(data, allTeams);
            updateLegend();
        });
    }

    document.getElementById("spider-select-1").value = champion;
    document.getElementById("spider-select-2").value = "";
    document.getElementById("spider-select-3").value = "";
    updateSelectOptions();

    if (!svg) {
        svg = d3.select("#spider-svg-wrapper")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        for (let lvl = 1; lvl <= levels; lvl++) {
            const r = (lvl / levels) * maxRadius;
            const points = metrics.map((_, i) => {
                const p = pointOnAxis(i, r);
                return `${p.x},${p.y}`;
            }).join(" ");
            svg.append("polygon")
                .attr("points", points)
                .attr("fill", "none")
                .attr("stroke", "#DDDDDD")
                .attr("stroke-width", 1);
        }

        metrics.forEach((m, i) => {
            const p = pointOnAxis(i, maxRadius);
            svg.append("line")
                .attr("x1", cx).attr("y1", cy)
                .attr("x2", p.x).attr("y2", p.y)
                .attr("stroke", "#DDDDDD")
                .attr("stroke-width", 1);

            const labelPos = pointOnAxis(i, maxRadius + 22);
            svg.append("text")
                .attr("x", labelPos.x)
                .attr("y", labelPos.y)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .style("font-size", "13px")
                .style("fill", "#555")
                .text(m);
        });

        svg.append("g").attr("class", "spider-polygons");

        metrics.forEach((m, i) => {
            const p = pointOnAxis(i, maxRadius);
            svg.append("line")
                .attr("class", `spider-axis-hover axis-${i}`)
                .attr("x1", cx).attr("y1", cy)
                .attr("x2", p.x).attr("y2", p.y)
                .attr("stroke", "transparent")
                .attr("stroke-width", 20)
                .style("cursor", "pointer")
                .on("mouseover", (event) => {
                    const teams = getSelectedTeams();
                    if (teams.length === 0) return;

                    const allStats = allTeams.map(team => ({
                        team, ...getTeamStats(data, team)
                    }));
                    const normalized = normalize(allStats);

                    const lines = teams.map((team, idx) => {
                        const raw = allStats.find(n => n.team === team);
                        return `<strong style="color:${SPIDER_COLORS[idx]}">${team}</strong>: ${raw[m]}`;
                    }).join("<br>");

                    tooltip.style("opacity", 1)
                        .html(`<strong>${m}</strong><br>${lines}`);

                    svg.select(`.axis-${i}`)
                        .attr("stroke", "#33333333")
                        .attr("stroke-width", 20);
                })
                .on("mousemove", (event) => {
                    tooltip
                        .style("left", (event.pageX + 12) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", () => {
                    tooltip.style("opacity", 0);
                    svg.select(`.axis-${i}`)
                        .attr("stroke", "transparent");
                });
        });
    }

    setTimeout(() => {
        renderPolygons(data, allTeams);
        updateLegend();
    }, 0);
}

function renderPolygons(data, allTeams) {
    const selectedTeams = getSelectedTeams();

    const allStats = allTeams.map(team => ({
        team, ...getTeamStats(data, team)
    }));
    const normalized = normalize(allStats);

    const g = svg.select(".spider-polygons");
    g.selectAll("*").remove();

    selectedTeams.forEach((team, idx) => {
        const teamNorm = normalized.find(s => s.team === team);
        if (!teamNorm) return;

        const points = polygonPoints(teamNorm.norm);
        const color = SPIDER_COLORS[idx];

        g.append("polygon")
            .attr("points", points.map(p => `${p.x},${p.y}`).join(" "))
            .attr("fill", color)
            .attr("fill-opacity", 0.2)
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .style("pointer-events", "none");

        metrics.forEach((m, i) => {
            const p = points[i];
            const rawStats = allStats.find(s => s.team === team);
            g.append("circle")
                .attr("cx", p.x)
                .attr("cy", p.y)
                .attr("r", 4)
                .attr("fill", color)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5)
                .style("cursor", "pointer")
                .on("mouseover", (event) => {
                    d3.select(event.currentTarget)
                        .transition().duration(100)
                        .attr("r", 7)
                        .attr("stroke-width", 2);
                    tooltip.style("opacity", 1)
                        .html(`
                            <span style="color:${color}">●</span>
                            <strong>${team}</strong><br>
                            <span style="color:#888">${m}</span>: 
                            <strong>${rawStats[m]}</strong>
                        `);
                })
                .on("mousemove", (event) => {
                    tooltip
                        .style("left", (event.pageX + 12) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", (event) => {
                    d3.select(event.currentTarget)
                        .transition().duration(100)
                        .attr("r", 4)
                        .attr("stroke-width", 1.5);
                    tooltip.style("opacity", 0);
                });
        });
    });
}

function updateSelectOptions() {
    const selected = [1, 2, 3]
        .map(i => document.getElementById(`spider-select-${i}`)?.value)
        .filter(v => v && v !== "");

    for (let i = 1; i <= 3; i++) {
        const select = document.getElementById(`spider-select-${i}`);
        const thisVal = select.value;
        Array.from(select.options).forEach(opt => {
            if (opt.value === "") return;
            opt.disabled = selected.includes(opt.value) && opt.value !== thisVal;
        });
    }
}

function updateLegend() {
    const legend = document.getElementById("spider-legend");
    if (!legend) return;
    const teams = getSelectedTeams();
    legend.innerHTML = teams.map((team, idx) => `
        <div class="spider-legend-item">
            <span class="spider-legend-dot" style="background:${SPIDER_COLORS[idx]}"></span>
            <img src="${getTeamLogo(team) || ''}" width="20" height="20" style="object-fit:contain;">
            <span>${team}</span>
        </div>
    `).join("");
}
