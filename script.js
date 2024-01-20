document.addEventListener('DOMContentLoaded',function(){
// Loading JSON Data and Initializing Dropdowns
let teamData = [];

fetch('ranking.json')
  .then(response => response.json())
  .then(data => {
    console.log("Data fetched successfully");  
    console.log("Loaded team data (first 3 teams):", data.slice(0, 3));
    teamData = data;
    initializeDropdowns();
  })
  .catch(error => {
    console.error('Error loading JSON data:', error);
    console.log("Fetch failed");
});

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
        console.log("Selected team A:", selectedTeam); // Log the selected team object
        if (selectedTeam) {
            document.getElementById('teamAPoints').value = parseFloat(selectedTeam['Total Points']).toFixed(2);
            console.log("Team A points after selection:", selectedTeam['Total Points']); // Log the points
        }
    });

    teamBDropdown.addEventListener('change', () => {
        let selectedTeam = teamData.find(team => team.Team === teamBDropdown.value);
        console.log("Selected team B:", selectedTeam); // Log the selected team object
        if (selectedTeam) {
            document.getElementById('teamBPoints').value = parseFloat(selectedTeam['Total Points']).toFixed(2);
            console.log("Team B points after selection:", selectedTeam['Total Points']); // Log the points
        }
    });

    // Programmatically trigger the 'change' event for the first team
    if (teamData.length > 0) {
        teamADropdown.dispatchEvent(new Event('change'));
        teamBDropdown.dispatchEvent(new Event('change'));
    }
    
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
    console.log("Calculated match scenarios:", results);
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
    var teamADropdown = document.getElementById('teamADropdown');
    var teamBDropdown = document.getElementById('teamBDropdown');
    var matchTypeDropdown = document.getElementById('matchType');
    var errorMessageDiv = document.getElementById('error-message');

    // Clear any previous error message
    errorMessageDiv.textContent = '';

    // Retrieve selected team names and matchType
    var teamAName = teamADropdown.value;
    var teamBName = teamBDropdown.value;
    var matchType = matchTypeDropdown.value;

    // Check if both teams are selected
    if (!teamAName || !teamBName) {
        errorMessageDiv.textContent = 'Please select both teams.';
        return;
    }

    // Check if a type of game is selected
    if (!matchType) {
        errorMessageDiv.textContent = 'Please select a type of game.';
        return;
    }

    // Check if both selected teams are the same
    if (teamAName === teamBName) {
        errorMessageDiv.textContent = "Error: The same team cannot play against itself.";
        return; // Exit the function if the same team is selected
    }

    // Define the variables for team points and parse them as floats from the input fields
    var teamAPoints = parseFloat(document.getElementById('teamAPoints').value);
    var teamBPoints = parseFloat(document.getElementById('teamBPoints').value);


    // Log the selected names and points for debugging
    console.log("Team A selected name:", teamAName);
    console.log("Team A selected points:", teamAPoints);
    console.log("Team B selected name:", teamBName);
    console.log("Team B selected points:", teamBPoints);

    // Calculate match scenarios
    var matchScenarios = calculateMatchScenarios(teamAName, teamAPoints, teamBName, teamBPoints, matchType);
    appendResults(teamAName, teamAPoints, teamBName, teamBPoints, matchType, matchScenarios);
    console.log('----- appendResults within performCalculation')

    // Reset dropdowns to show default options after calculation
    teamADropdown.selectedIndex = 0;
    teamBDropdown.selectedIndex = 0;
    matchTypeDropdown.selectedIndex = 0;
    
}



// Attach event listeners
document.getElementById('calculateButton').addEventListener('click', performCalculation);
//document.getElementById('fillTestDataButton').addEventListener('click', fillTestData);


function appendResults(teamAName, teamAPoints, teamBName, teamBPoints, matchType, matchScenarios) { 
    var resultsContainer = document.getElementById('results-container');
    var resultCard = document.createElement('div');
    resultCard.className = 'result-card';

    // Give the result card a unique ID
    var uniqueId = 'resultCard-' + Date.now();
    resultCard.id = uniqueId;
    
    // Append the new simulation link to the result card
    var newSimulationLink = createNewSimulationLink();
    resultCard.appendChild(newSimulationLink);
  

    // Create the header for the card with improved formatting
    var simulationInfo = document.createElement('p');
    simulationInfo.innerHTML = `Simulation: <strong>${teamAName}</strong> (${teamAPoints.toFixed(2)} points before the game) VS <strong>${teamBName}</strong> (${teamBPoints.toFixed(2)} points before the game)`;
    simulationInfo.className = 'simulation-info';

    var importanceInfo = document.createElement('p');
    importanceInfo.innerHTML = `Importance of match: I = ${calculateMatchImportance(matchType)}, ${matchType.replace(/_/g, ' ')}`;
    importanceInfo.className = 'importance-info';

    // Append the formatted text to the card header
    var header = document.createElement('div');
    header.className = 'result-card-header';
    header.appendChild(simulationInfo);
    header.appendChild(importanceInfo);

    // Append the header to the result card
    resultCard.appendChild(header);


    // Create the table for the scenarios
    var table = document.createElement('table');
    Object.keys(matchScenarios).forEach(function(scenario) {
        var row = table.insertRow();
        var cellScenario = row.insertCell();
        var cellTeamAPoints = row.insertCell();
        var cellTeamBPoints = row.insertCell();

        cellScenario.textContent = scenario.replace(/_/g, ' ');
        var teamAResult = matchScenarios[scenario][teamAName];
        var teamBResult = matchScenarios[scenario][teamBName];
        cellTeamAPoints.textContent = formatPointsChange(teamAResult.points_change) + ' (' + teamAResult.points_after.toFixed(2) + ')';
        cellTeamBPoints.textContent = formatPointsChange(teamBResult.points_change) + ' (' + teamBResult.points_after.toFixed(2) + ')';
    });
    resultCard.appendChild(table);

    // Append the result card to the results container
    resultsContainer.appendChild(resultCard);

    // Show the clear results button
    document.getElementById('clearResultsButton').style.display = 'block';
    document.getElementById(uniqueId).scrollIntoView({ behavior: 'smooth' });

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

//Clear Results Button
document.getElementById('clearResultsButton').addEventListener('click', function() {
    document.getElementById('results-container').innerHTML = '';
    this.style.display = 'none'; // Hide the button after clearing results
});

});

// Function to scroll to the top of the page
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  // Function to create a new simulation link
  function createNewSimulationLink() {
    var link = document.createElement('a');
    link.href = "#"; // Although the default action will be prevented, it's good practice to have the href attribute.
    link.textContent = "New simulation";
    link.addEventListener('click', function(event) {
      event.preventDefault(); // Prevent the default anchor action
      scrollToTop();
    });
    return link;
  }