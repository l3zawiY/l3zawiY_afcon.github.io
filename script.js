// Loading JSON Data and Initializing Dropdowns
let teamData = [];

fetch('ranking.json')
  .then(response => response.json())
  .then(data => {
      teamData = data;
      initializeDropdowns();
  })
  .catch(error => console.error('Error loading JSON data:', error));

function initializeDropdowns() {
    const teamADropdown = document.getElementById('teamADropdown');
    const teamBDropdown = document.getElementById('teamBDropdown');
    teamData.forEach(team => {
        const option1 = document.createElement('option');
        option1.value = option1.textContent = team.Team;
        teamADropdown.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = option2.textContent = team.Team;
        teamBDropdown.appendChild(option2);
    });


    // Update points when a team is selected
    teamADropdown.addEventListener('change', () => {
        let selectedTeam = teamData.find(team => team.Team === teamADropdown.value);
        if (selectedTeam) {
            document.getElementById('teamAPoints').value = selectedTeam['Total Points'];
        }
    });

    teamBDropdown.addEventListener('change', () => {
        let selectedTeam = teamData.find(team => team.Team === teamBDropdown.value);
        if (selectedTeam) {
            document.getElementById('teamBPoints').value = selectedTeam['Total Points'];
        }
    });
}



// Functions for calculating match points based on FIFA's ranking system

// This function calculates the expected result of the match based on team points
function calculateExpectedResult(teamAPoints, teamBPoints) {
    var dr = teamAPoints - teamBPoints;
    return 1 / (Math.pow(10, -dr / 600) + 1);
}

// This function determines the importance of the match based on the match type
function calculateMatchImportance(matchType) {
    var importanceDict = {
        'friendly_outside_calendar': 5,
        'friendly': 10,
        'nations_league_group': 15,
        'nations_league_playoff_final': 25,
        'confederation_qualifier_world_cup_qualifier': 25,
        'confederation_final_up_to_QF': 35,
        'confederation_final_QF_onwards': 40,
        'world_cup_final_up_to_QF': 50,
        'world_cup_final_QF_onwards': 60
    };
    return importanceDict[matchType] || 10;
}

// This function calculates the change in points after the match
function calculatePointsChange(Pbefore, I, W, We, matchType) {
    var pointsChange = I * (W - We);
    var knockOutTypesNoLoss = ['confederation_final_QF_onwards', 'world_cup_final_QF_onwards'];
    if (knockOutTypesNoLoss.includes(matchType) && pointsChange < 0) {
        pointsChange = 0;
    }
    return pointsChange;
}

// This function calculates the points for each team in all match scenarios
function calculateMatchScenarios(teamAName, teamAPoints, teamBName, teamBPoints, matchType) {
    var scenarios = ['win', 'win_penalty', 'draw', 'loss', 'loss_penalty'];
    var results = {};
    
    var I = calculateMatchImportance(matchType);
    var We = calculateExpectedResult(teamAPoints, teamBPoints);
    
    scenarios.forEach(function(scenario) {
        var W = scenario === 'win' ? 1 : scenario === 'win_penalty' ? 0.75 : scenario === 'draw' ? 0.5 : scenario === 'loss_penalty' ? 0.5 : 0;
        var teamAChange = calculatePointsChange(teamAPoints, I, W, We, matchType);
        var teamBChange = calculatePointsChange(teamBPoints, I, 1 - W, 1 - We, matchType);
        
        results[scenario] = {
            [teamAName]: {'points_before': teamAPoints, 'points_after': teamAPoints + teamAChange, 'points_change': teamAChange},
            [teamBName]: {'points_before': teamBPoints, 'points_after': teamBPoints + teamBChange, 'points_change': teamBChange}
        };
    });
    return results;
}

// Functions for calculating match points based on FIFA's ranking system
// ... (Keep the existing functions as they are - calculateExpectedResult, calculateMatchImportance, calculatePointsChange, calculateMatchScenarios) ...

// Function to format the points change for display
function formatPointsChange(pointsChange) {
    var sign = pointsChange >= 0 ? '+' : '';
    return sign + pointsChange.toFixed(2);
}

// This function returns the full text for a scenario
function getScenarioFull(scenarioKey, teamAName, teamBName) {
    var scenariosFull = {
        'win': teamAName + ' wins against ' + teamBName,
        'win_penalty': teamAName + ' wins (penalty) against ' + teamBName,
        'draw': teamAName + ' draws with ' + teamBName,
        'loss_penalty': teamAName + ' loses (penalty) against ' + teamBName,
        'loss': teamAName + ' loses to ' + teamBName
    };
    return scenariosFull[scenarioKey] || scenarioKey;
}


// Function to perform the calculation and display the results
function performCalculation() {
    // Retrieve selected team names and points
    var teamAName = document.getElementById('teamADropdown').value;
    var teamAPointsInput = document.getElementById('teamAPoints'); // Define this variable
    var teamBName = document.getElementById('teamBDropdown').value;
    var teamBPointsInput = document.getElementById('teamBPoints'); // Define this variable

    var teamAPoints = parseFloat(teamAPointsInput.value); // Use the defined variable
    var teamBPoints = parseFloat(teamBPointsInput.value); // Use the defined variable

    var matchType = document.getElementById('matchType').value; // Assuming this is still manually entered or selected

    console.log('Team A Dropdown:', teamADropdown);
    console.log('Team A Points Input:', teamAPointsInput);
    console.log('Team B Dropdown:', teamBDropdown);
    console.log('Team B Points Input:', teamBPointsInput);


    // Calculate match scenarios
    var matchScenarios = calculateMatchScenarios(teamAName, teamAPoints, teamBName, teamBPoints, matchType);
    appendResults(teamAName, teamAPoints, teamBName, teamBPoints, matchType, matchScenarios);
    console.log('----- appendResults within performCalculation')

}

// Attach event listeners
document.getElementById('calculateButton').addEventListener('click', performCalculation);
//document.getElementById('fillTestDataButton').addEventListener('click', fillTestData);


// This function appends the results of the current simulation to the 'allResults' div
function appendResults(teamAName, teamAPoints, teamBName, teamBPoints, matchType, matchScenarios) {
    var allResultsDiv = document.getElementById('allResults');
    var resultsFragment = document.createDocumentFragment();
    
    var summaryDiv = document.createElement('div');
    var importance = calculateMatchImportance(matchType);
    summaryDiv.innerHTML = '<p><strong>Importance of match:</strong> I = ' + importance + ', ' + matchType.replace(/_/g, ' ') + '</p>'
                         + '<p><strong>' + teamAName + ':</strong> beforeP = ' + teamAPoints.toFixed(2)
                         + ', <strong>' + teamBName + ':</strong> beforeP = ' + teamBPoints.toFixed(2) + '</p>';
    resultsFragment.appendChild(summaryDiv);
    
    var resultsTable = document.createElement('table');
    var tbody = document.createElement('tbody');
    Object.keys(matchScenarios).forEach(function(scenario) {
        var row = tbody.insertRow();
        var cellScenario = row.insertCell();
        var cellTeamAPoints = row.insertCell();
        var cellTeamBPoints = row.insertCell();
        
        cellScenario.textContent = scenario.replace(/_/g, ' ');
        var teamAResult = matchScenarios[scenario][teamAName];
        var teamBResult = matchScenarios[scenario][teamBName];
        cellTeamAPoints.innerHTML = (teamAResult.points_change >= 0 ? '+' : '') + teamAResult.points_change.toFixed(2) + ' (' + teamAResult.points_after.toFixed(2) + ')';
        cellTeamBPoints.innerHTML = (teamBResult.points_change >= 0 ? '+' : '') + teamBResult.points_change.toFixed(2) + ' (' + teamBResult.points_after.toFixed(2) + ')';
    });
    resultsTable.appendChild(tbody);
    resultsFragment.appendChild(resultsTable);
    
    allResultsDiv.appendChild(resultsFragment);
}

// Event listener for the 'Calculate' button
document.getElementById('calculateButton').addEventListener('click', function() {
    var teamAName = document.getElementById('teamADropdown').value;  // Changed to 'teamADropdown'
    var teamAPoints = parseFloat(document.getElementById('teamAPoints').value);
    var teamBName = document.getElementById('teamBDropdown').value;  // Changed to 'teamBDropdown'
    var teamBPoints = parseFloat(document.getElementById('teamBPoints').value);
    var matchType = document.getElementById('matchType').value;
    
    var matchScenarios = calculateMatchScenarios(teamAName, teamAPoints, teamBName, teamBPoints, matchType);
    //appendResults(teamAName, teamAPoints, teamBName, teamBPoints, matchType, matchScenarios);
    //console.log('----- appendResults within calculateButton')
    // Optionally reset the form for a new simulation
    // document.getElementById('fifaForm').reset();
});


// ...existing fillTestData function and its event listener...


// This function displays the summary of the match information.
function displaySummary(teamAName, teamAPoints, teamBName, teamBPoints, matchType) {
    var summaryDiv = document.getElementById('summary');
    var importance = calculateMatchImportance(matchType);
    // Set the innerHTML of the summary div with match information.
    summaryDiv.innerHTML = '<p><strong>Importance of match:</strong> I = ' + importance + 
                           ', ' + matchType.replace(/_/g, ' ') + '</p>' +
                           '<p><strong>' + teamAName + ':</strong> beforeP = ' + teamAPoints.toFixed(2) + 
                           ', <strong>' + teamBName + ':</strong> beforeP = ' + teamBPoints.toFixed(2) + '</p>';
}

// This function displays the results table for the match scenarios.
function displayResultsTable(matchScenarios, teamAName, teamBName) {
    var resultsTableBody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
    // Clear any previous results.
    resultsTableBody.innerHTML = '';

    // Create table rows for each scenario.
    Object.keys(matchScenarios).forEach(function(scenario) {
        var row = resultsTableBody.insertRow();
        var cellScenario = row.insertCell(0);
        var cellTeamAPoints = row.insertCell(1);
        var cellTeamBPoints = row.insertCell(2);

        // Insert the scenario and points change with the appropriate class for coloring.
        cellScenario.innerHTML = getScenarioFull(scenario, teamAName, teamBName);
        cellScenario.classList.add(scenario.includes('win') ? 'win' : 'lose');

        var teamAChange = matchScenarios[scenario][teamAName].points_change;
        var teamBChange = matchScenarios[scenario][teamBName].points_change;

        // Use the formatPointsChange function to format the points change display.
        cellTeamAPoints.innerHTML = formatPointsChange(teamAChange) + ' (' + matchScenarios[scenario][teamAName].points_after.toFixed(2) + ')';
        cellTeamAPoints.classList.add(teamAChange >= 0 ? 'gain' : 'loss');

        cellTeamBPoints.innerHTML = formatPointsChange(teamBChange) + ' (' + matchScenarios[scenario][teamBName].points_after.toFixed(2) + ')';
        cellTeamBPoints.classList.add(teamBChange >= 0 ? 'gain' : 'loss');
    });
}

// This function formats the points change for display.
function formatPointsChange(pointsChange) {
    var sign = pointsChange >= 0 ? '+' : '';
    return sign + pointsChange.toFixed(2);
}

// This function returns the full text for a scenario.
function getScenarioFull(scenarioKey, teamAName, teamBName) {
    var scenariosFull = {
        'win': teamAName + ' wins against ' + teamBName,
        'win_penalty': teamAName + ' wins (penalty) against ' + teamBName,
        'draw': teamAName + ' draws with ' + teamBName,
        'loss_penalty': teamAName + ' loses (penalty) against ' + teamBName,
        'loss': teamAName + ' loses to ' + teamBName
    };
    return scenariosFull[scenarioKey] || scenarioKey;
}





// Function to populate team dropdowns
function populateTeamDropdowns(teams) {
    const teamADropdown = document.getElementById('teamADropdown');
    const teamBDropdown = document.getElementById('teamBDropdown');

    // Clear existing options
    teamADropdown.innerHTML = '';
    teamBDropdown.innerHTML = '';

    // Add each team to the dropdowns
    teams.forEach(team => {
        teamADropdown.add(new Option(team.Team, team.Team));
        teamBDropdown.add(new Option(team.Team, team.Team));
    });

    // Manually set the points for the first team
    if (teams.length > 0) {
        document.getElementById('teamAPoints').value = teams[0]['Total Points'];
        document.getElementById('teamBPoints').value = teams[0]['Total Points'];
    }
    

    // Update points when a team is selected
    teamADropdown.addEventListener('change', () => {
        let selectedTeam = teams.find(team => team.Team === teamADropdown.value);
        if (selectedTeam) {
            document.getElementById('teamAPoints').value = selectedTeam['Total Points'];
        }
    });
    teamBDropdown.addEventListener('change', () => {
        let selectedTeam = teams.find(team => team.Team === teamBDropdown.value);
        if (selectedTeam) {
            document.getElementById('teamBPoints').value = selectedTeam['Total Points'];
        }
    });
    
}
