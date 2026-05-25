export function assignRounds(data) {
    const seasons = [...new Set(data.map(d => d.season))];
    const result = [];

    for (const season of seasons) {
        const seasonMatches = data
            .filter(d => d.season === season)
            .sort((a, b) => new Date(a.Date) - new Date(b.Date));

        const MATCHES_PER_ROUND = 10;
        seasonMatches.forEach((match, i) => {
            result.push({
                ...match,
                Round: Math.floor(i / MATCHES_PER_ROUND) + 1
            });
        });
    }

    return result;
}
