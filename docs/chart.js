(function() {
  var optionsPlace, optionsPlacePercent, optionsPoints, optionsPointsPercent;

  optionsPoints = {
    title: {
      text: ''
    },
    chart: {
      renderTo: 'points_chart',
      type: 'line'
    },
    xAxis: {
      title: {
        text: 'Match #'
      }
    },
    yAxis: {
      title: {
        text: 'Points'
      }
    },
    legend: {
      layout: 'vertical',
      align: 'right'
    },
    series: []
  };

  optionsPointsPercent = {
    title: {
      text: ''
    },
    tooltip: {
      valueSuffix: '%'
    },
    chart: {
      renderTo: 'points_percent_chart',
      type: 'line'
    },
    xAxis: {
      title: {
        text: 'Match #'
      }
    },
    yAxis: {
      title: {
        text: '% Points'
      }
    },
    legend: {
      layout: 'vertical',
      align: 'right'
    },
    series: []
  };

  optionsPlacePercent = {
    title: {
      text: ''
    },
    tooltip: {
      valueSuffix: '.'
    },
    chart: {
      renderTo: 'place_percent_chart',
      type: 'line'
    },
    xAxis: {
      title: {
        text: 'Match #'
      }
    },
    yAxis: {
      title: {
        text: '% of points of 1. place'
      }
    },
    legend: {
      layout: 'vertical',
      align: 'right'
    },
    series: []
  };

  optionsPlace = {
    title: {
      text: ''
    },
    tooltip: {
      valueSuffix: '.'
    },
    chart: {
      renderTo: 'place_chart',
      type: 'line'
    },
    xAxis: {
      title: {
        text: 'Match #'
      }
    },
    yAxis: {
      title: {
        text: 'Place'
      },
      reversed: true,
      categories: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
    },
    legend: {
      layout: 'vertical',
      align: 'right'
    },
    series: []
  };

  $.getJSON('https://www.openligadb.de/api/getmatchdata/bl1/2018', function(matchArray) {
    var game, goalsTeam1, goalsTeam2, i, j, k, l, len, len1, len2, len3, match, matchNum, matches, max, maxPoints, p, points, pointsTeam1, pointsTeam2, pos, position, positions, result, team, team1, team2, teams;
    teams = []; // [team: [match: points]]
    for (i = 0, len = matchArray.length; i < len; i++) {
      match = matchArray[i];
      team1 = match.Team1.TeamName;
      team2 = match.Team2.TeamName;
      result = match.MatchResults[1];
      if (!result) {
        continue;
      }
      goalsTeam1 = result.PointsTeam1;
      goalsTeam2 = result.PointsTeam2;
      // get the points
      if (goalsTeam1 > goalsTeam2) {
        pointsTeam1 = 3;
        pointsTeam2 = 0;
      } else if (goalsTeam2 > goalsTeam1) {
        pointsTeam1 = 0;
        pointsTeam2 = 3;
      } else {
        pointsTeam1 = 1;
        pointsTeam2 = 1;
      }
      if (!teams[team1]) {
        teams[team1] = [];
      } else {
        pointsTeam1 += teams[team1][teams[team1].length - 1];
      }
      if (!teams[team2]) {
        teams[team2] = [];
      } else {
        pointsTeam2 += teams[team2][teams[team2].length - 1];
      }
      teams[team1].push(pointsTeam1);
      teams[team2].push(pointsTeam2);
    }
    maxPoints = [];
    for (team in teams) {
      points = teams[team];
      match = 0;
      for (j = 0, len1 = points.length; j < len1; j++) {
        p = points[j];
        if (!maxPoints[match]) {
          maxPoints[match] = 0;
        }
        if (p > maxPoints[match]) {
          maxPoints[match] = p;
        }
        match++;
      }
    }
    // TODO sort, then map to positionin table for given day
    // Set data points'for points
    for (team in teams) {
      points = teams[team];
      optionsPoints.series.push({
        name: team,
        data: points
      });
      game = 0;
      optionsPointsPercent.series.push({
        name: team,
        data: points.map(function(p) {
          game++;
          return p / (game * 3) * 100;
        })
      });
      game = 0;
      optionsPlacePercent.series.push({
        name: team,
        data: points.map(function(p) {
          return p / maxPoints[game++];
        })
      });
    }
    // [teams: [points]] -> [match: [team: points]]
    matches = [];
    for (team in teams) {
      points = teams[team];
      game = 0;
      for (k = 0, len2 = points.length; k < len2; k++) {
        p = points[k];
        if (!matches[game]) {
          matches[game] = [];
        }
        matches[game++][team] = p;
      }
    }
    // [match: [team: points]] -> [teams: [position]]
    positions = [];
    matchNum = 0;
    for (l = 0, len3 = matches.length; l < len3; l++) {
      match = matches[l];
      position = 1;
      max = {
        team: '',
        points: 0
      };
      while (max.points !== -1) {
        max.points = -1;
        for (team in match) {
          points = match[team];
          if (points > max.points) {
            max.points = points;
            max.team = team;
          }
        }
        if (!positions[max.team]) {
          positions[max.team] = [];
        }
        positions[max.team][matchNum] = position++;
        match[max.team] = -1;
      }
      matchNum++;
    }
    for (team in positions) {
      pos = positions[team];
      optionsPlace.series.push({
        name: team,
        data: pos.map(function(p) {
          if (p === 19) { // (temp) fix for weird glitch
            return 18;
          } else {
            return p;
          }
        })
      });
    }
    new Highcharts.Chart(optionsPoints);
    new Highcharts.Chart(optionsPointsPercent);
    new Highcharts.Chart(optionsPlacePercent);
    return new Highcharts.Chart(optionsPlace);
  });

}).call(this);