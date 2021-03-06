// to destroy them when reloading
var charts = [];


async function fetchData(league, season) {
	const url = "https://www.openligadb.de/api/getmatchdata/" + league + "/" + season;
	console.log(url);
	const result = await fetch(url);
	const matches = (await result.json()).filter(m => m.MatchIsFinished);

	// Day => Matches
	const matchdays = matches.groupBy(m => m.Group.GroupOrderID)

	// Team => Day => Points
	const teams = groupMatchesByTeam(matchdays);
	const teamCount = teams.size;

	// Team => [Points]
	const teamPoints = sortMatchdays(teams);

	// Team => [Acc Points]
	const accTeamPoints = teamPoints.mapValues(ps => ps.reduce((acc, p) => {
		if (acc.length == 0) acc.push(p)
		else acc.push(p + acc[acc.length - 1]);
		return acc;
	}, []));


	const matchdayCount = Math.max(...matches.map(m => m.Group.GroupOrderID), 0);
	// console.log("Match days with data: " + matchdayCount);
	const labels = Array.from(Array(matchdayCount), (_, i) => i + 1);


	// Acc Points => % Points
	const percentTeamPoints = accTeamPoints.mapValues(ps => ps.map((p, i) => p / (3 * (i+1))));

	// Day => Table
	const table = Array.from(Array(matchdayCount), (_, i) => {
		const order = Array.from(accTeamPoints.mapValues(a => a[i]))
												// elements are lists of [team, points]
							         .sort((a, b) => b[1] - a[1])
											 .map(x => x[0]);
		return order;
	});

	// Team => [Place]
	const placement = teams.mapValues((team, _) => {
		return table.map(order => {
			return order.indexOf(team) + 1;
		});
	});

	charts.forEach(c => {
		c.destroy()
	});


	charts.push( chartIt("pointChart", accTeamPoints, labels, 3, false) );
	charts.push( chartIt("percentChart", percentTeamPoints, labels, 0, false) );
	charts.push( chartIt("place", placement, labels, 0, true) );
}

function groupMatchesByTeam(matchdays) {
	const teams = new Map();

	for ([day, matchesOnDay] of matchdays) {
		for (match of matchesOnDay) {
			const info = extractMatchInfo(match);
			if (! info) continue;
			if (! teams.has(info.team1)) teams.set(info.team1, new Map());
			teams.get(info.team1).set(day, info.points1);
			if (! teams.has(info.team2)) teams.set(info.team2, new Map());
			teams.get(info.team2).set(day, info.points2);
		}
	}

	return teams;
}

function sortMatchdays(teams) {
	return teams.mapValues(days =>
		days.toArray().sortBy(([day, _]) => day).map(([_, p]) => p)
	);
}

function extractMatchInfo(match) {
	if (! match.MatchResults[0]) {
		console.log("No match data!", match);
		return null;
	}
	const result = match.MatchResults[0]; //TODO whoch one to use
	const goals1 = result.PointsTeam1;
	const goals2 = result.PointsTeam2;

	var points1, points2;
	if (goals1 > goals2) {
		points1 = 3;
		points2 = 0;
	} else if (goals1 < goals2) {
		points1 = 0;
		points2 = 3;
	} else {
		points1 = 1;
		points2 = 1;
	}

	return {
		team1: match.Team1.TeamName,
		points1: points1,
		team2: match.Team2.TeamName,
		points2: points2
	}
}

function chartIt(chart, data, labels, width, reverse) {
	const ctx = document.getElementById(chart).getContext('2d');
	const fontColor = "white";
	const tickColor = 'rgba(255, 255, 255, 0.16)';
	return new Chart(ctx, {	
    type: 'stripe',
    data: {
        labels: labels,
        datasets: data.toArray()
					.map(([team, points]) => chartTeamPoints(team, points, width, ctx))
    },
		options: {
			responsive: true,
			maintainAspectRatio: false,
			legend: {
				labels: {
					fontColor: fontColor
				}
			},
			scales: {
	      xAxes: [{
	        gridLines: {
	          drawOnChartArea: false,
						color: tickColor
	        },
					ticks: {
						fontColor: fontColor
					}
	      }],
				yAxes: [{
					gridLines: {
						color: tickColor
					},
					ticks: {
						max: Math.max(...data.toArray().flatMap(([_, points]) => points)) + width,
						fontColor: fontColor,
						reverse: reverse
					}
				}]
			},
			tooltips: {
				mode: 'nearest',
				intersect: false,
			}
		}
	});
}

function chartTeamPoints(team, points, width, ctx) {
	const [color, secondaryColor] = getColor(team);
	// console.log(team + ": " + color);

	var contentWidth = window.innerWidth || document.body.clientWidth;
	const gradient = ctx.createLinearGradient(0, 0, contentWidth, 0);
	const steps = contentWidth / 50;
	for (var i = 1; i < steps; i++) {
		gradient.addColorStop(i/steps - 1/steps, color);
		gradient.addColorStop(i/steps, secondaryColor);
	}

	return {
			label: team,
			data: points,
			width: Array(100).fill(width),
			fill: false,
			borderColor: gradient,
			backgroundColor: w3color(color).toHexString() + '08', // add alpha value
			borderWidth: 2,
			lineTension: 0.2, // closer to 0 => straight lines
			pointStyle: 'point',
			pointRadius: 2,
			pointHoverRadius: 4,
			pointBorderWidth: 2,
	}
}

var toggle3 = true;
// ui hook
function load() {
	const leagueSel = document.getElementById('league');
	const seasonSel = document.getElementById('season');
	// for stripe chart
	document.getElementById('toggle3').addEventListener('change', () => {
		toggle3 = !toggle3;
		charts.forEach((c, i) => {
			c.update();
		});

	});
	fetchData(leagueSel.value, seasonSel.value);
}

window.onload = () => load();
