let selectModeButtons = document.querySelectorAll('.mode-selection-btn');
let singleplayerContainer = document.querySelector('.singleplayer-mode');
let multiplayerContainer = document.querySelector('.multiplayer-mode');

let createLobbyButton = document.querySelector('#new-game-btn');
let joinLobbyButton = document.querySelector('#join-game-btn');

let lobbySizeDropdown = document.querySelector('.multiplayer-mode .lobbysize-dropdown');
let lobbySizeOptions = lobbySizeDropdown.lastElementChild.children;

let botGameSizeDropdown = document.querySelector('.singleplayer-mode .lobbysize-dropdown');
let botGameSizeOptions = botGameSizeDropdown.lastElementChild.children;

let messageContainer = document.getElementById('message-container')
function errorMessage() {
    const urlParams = new URLSearchParams(window.location.search);
    const myParam = urlParams.get('error');
    if (myParam) {
        messageContainer.classList.add('error-message')
        if (myParam === "startedroom") {
            messageContainer.innerText = 'The lobby you attempted to join is already in game!';
        }
        else if (myParam === "fullroom") {
            messageContainer.innerText = 'The lobby you attempted to join is full!';
        }
        else if (myParam === "roomexists") {
            messageContainer.innerText = 'Lobby with this name already exists!';
        }
        else {
            messageContainer.innerText = myParam;
        }
        setTimeout(() => {
            messageContainer.classList.remove('error-message')
        }, 3000);
    }
}
errorMessage()

// Toggle between gamemodes
for (var i = 0; i < selectModeButtons.length; i++) {
    selectModeButtons[i].addEventListener('click', function() {
        if (this.parentElement.querySelector('.selected') != this) {
            this.parentElement.querySelector('.selected').classList.remove('selected');
            this.classList.add('selected');
        }
        if (this.id === "bot-mode") {
            if (multiplayerContainer.classList.contains('open-flex')) {
                multiplayerContainer.classList.remove('open-flex');
            }
            singleplayerContainer.classList.add('open-flex');
        }
        else {
            if (singleplayerContainer.classList.contains('open-flex')) {
                singleplayerContainer.classList.remove('open-flex');
            }
            multiplayerContainer.classList.add('open-flex')
        }
    })
}
// Toggle form on "create lobby" button click

createLobbyButton.addEventListener('click', function() {
    this.nextElementSibling.classList.toggle('open-flex');
    document.querySelector('.form-modal-popup').classList.add('triggered');
})

// Close form on outside of form click

window.addEventListener('click', function(e) {
    let multplayerForm = document.querySelector('form#gamelobby');
    let botForm = document.querySelector('form#botgame');

    let modal = document.querySelector('.form-modal-popup')

    if (e.target.closest('.form-modal-popup.triggered') && multplayerForm.classList.contains('open-flex')) {
        modal.classList.remove('triggered');
        multplayerForm.classList.remove('open-flex')
    }
    else if (e.target.closest('.form-modal-popup.triggered') && botForm.classList.contains('open-flex')) {
        modal.classList.remove('triggered');
        botForm.classList.remove('open-flex')
    }
})

// Display password fields if lobby is private

document.querySelector('input#lobbyprivate').addEventListener('change', function() {
    let lobbyPasswordLabel = document.createElement('label');
    lobbyPasswordLabel.for = 'lobbypassword';
    lobbyPasswordLabel.innerText = 'Join password:';
    let lobbyPasswordInput = document.createElement('input');
    lobbyPasswordInput.type = 'text';
    lobbyPasswordInput.id = 'lobbypassword';
    lobbyPasswordInput.name = 'lobbypassword';

    if (this.checked === true) {
        this.parentElement.parentElement.insertBefore(lobbyPasswordInput, this.parentElement.nextElementSibling);
        this.parentElement.parentElement.insertBefore(lobbyPasswordLabel, this.parentElement.nextElementSibling);
    }
    else {
        for (var i = 0; i < this.parentElement.parentElement.children.length; i++) {
            if (this.parentElement.parentElement.children[i].id === lobbyPasswordInput.id) {
                let labelForInput = this.parentElement.parentElement.children[i].previousElementSibling;
                this.parentElement.parentElement.children[i].remove();
                labelForInput.remove();
            }
        }
    }
})

// Lobby size dropdown functionality

for (var i = 0; i < lobbySizeOptions.length; i++) {
    lobbySizeOptions[i].addEventListener('click', function() {
        let value = parseInt(this.innerText);
        document.querySelector('input#lobbysize').value = value;
        lobbySizeDropdown.firstElementChild.innerText = this.innerText;
        this.parentElement.classList.remove('show')
        this.parentElement.parentElement.classList.remove('show')
    })
}

lobbySizeDropdown.firstElementChild.addEventListener('click', function() {
    this.nextElementSibling.classList.toggle('show');
    this.parentElement.classList.toggle('show');
})

for (var i = 0; i < botGameSizeOptions.length; i++) {
    botGameSizeOptions[i].addEventListener('click', function() {
        let value = parseInt(this.innerText);
        document.querySelector('input#botgamesize').value = value;
        botGameSizeDropdown.firstElementChild.innerText = this.innerText;
        this.parentElement.classList.remove('show')
        this.parentElement.parentElement.classList.remove('show')
    })
}

botGameSizeDropdown.firstElementChild.addEventListener('click', function() {
    this.nextElementSibling.classList.toggle('show');
    this.parentElement.classList.toggle('show');
})

// Toggle games list on "join lobby" button click

joinLobbyButton.addEventListener('click', function() {
    if (gamesList.children[0].tagName === 'SPAN') {
        gamesList.classList.toggle('open-flex');
    }
    else {
        gamesList.classList.toggle('opened');
        document.querySelector('.form-modal-popup').classList.add('triggered')
    }
})
window.addEventListener('click', function(e) {
    let modal = document.querySelector('.form-modal-popup')

    if (e.target.closest('.form-modal-popup.triggered') && gamesList.classList.contains('opened')) {
        modal.classList.remove('triggered');
        gamesList.classList.remove('opened')
    }
})

document.querySelector('#start-bot-game').addEventListener('click', function() {
    this.nextElementSibling.classList.toggle('open-flex');
    document.querySelector('.form-modal-popup').classList.add('triggered');
})

function handleBotGame(gamesize) {
    let playerTurn = 0;
    let players = [];
    players[0] = ['You',{totalScore: 0}]

    for (var i = 1; i < gamesize; i++) {
        players[i] = ['BOT Player ' + [i],{totalScore: 0}];
    }

    setupBotGameUI();
    fillBotGameUI(players)
    displayBotTurnMessage(players[playerTurn])
    botGameLogic(players,playerTurn)

    function fillBotGameUI(players) {
        let namesList = '';
        let statusList = '';

        players.forEach(player => {
            let newPlayer = document.createElement('li');
            newPlayer.innerText = player[0];
            newPlayer.dataset.playername = player[0];
            let newPlayerScore = document.createElement('li');
            newPlayerScore.innerText = player[1].totalScore;
            newPlayerScore.dataset.playername = player[0];;
    
            namesList += newPlayer.outerHTML;
            statusList += newPlayerScore.outerHTML
        })
        let playersNamesList = document.getElementById('players-names-list');
        let playersStatusList = document.getElementById('players-status-list');
        
        playersNamesList.innerHTML = namesList;
        playersStatusList.innerHTML = statusList;

        playersNamesList.querySelector("[data-playername="+ players[0][0] +"]").classList.add('you')
    }

    function setupBotGameUI() {
        document.querySelector('.form-modal-popup').classList.remove('triggered');
        let container = document.createElement('div')
        container.innerHTML = 
        '<div id="game-container">'
            +'<div id="players-info">'+
                '<div id="players-list">'
                    +'<div id="list-names-container">'+
                        '<span>Players in lobby</span>'
                        +'<span>Scores</span>'+
                    '</div>'
                    +'<div id="list-content-container">'+
                        '<ol id="players-names-list"></ol>'
                        +'<ol id="players-status-list"></ol>'+
                    '</div>'
                +'</div>'+
            '</div>'
            +'<div id="game-window-container">'+
                '<div id="game-window">'
                    +'<div class="game-background"></div>'+
                    '<div class="dice-container">'
                        +'<div id="dice1"></div>'+
                        '<div id="dice2"></div>'
                        +'<div id="dice3"></div>'+
                        '<div id="dice4"></div>'
                        +'<div id="dice5"></div>'+
                    '</div>'
                +'</div>'+
                '<div id="user-turn-info">'
                +'</div>'+
            '</div>'
        +'</div>';
        document.querySelector('#game-mode').innerHTML = container.innerHTML;
    }

    function displayBotTurnMessage(currentPlayer) {
        if (currentPlayer === players[0]) {
            clearDice()
            document.getElementById('user-turn-info').innerText =  "Your turn! Press the button to throw.";
        }
        else {
            clearDice()
            document.getElementById('user-turn-info').innerText = "Waiting for " + currentPlayer[0] + " to throw.";
        }
    }

    function botGameLogic(players,playerTurn) {
        let diceResult = [];

        if (players[playerTurn] === players[0]) {
            document.getElementById('game-window-container').firstElementChild.innerHTML = getGameWindowSetup();
            document.getElementById('throw-dice-button').addEventListener('click', function() {
                diceNumbers(diceResult);
                players[playerTurn][1].totalScore += throwScore;
    
                this.remove()

                throwDiceAnimation(diceResult)
                displayThrowInfo(players[playerTurn], diceResult, throwScore, playerTurn)
                
                if (players[playerTurn][1].totalScore >= 151) {
                    setTimeout(() => {
                        let winningMessage = 'Congratz, you smashed them!!!';
                        gameEnd(players[playerTurn][0], winningMessage)
                    }, 5000);
                }
                else {
                    setTimeout(() => {
                        
                        playerTurn++;
                        if (playerTurn == players.length) {
                            playerTurn = 0;
                        }
                        nextPlayerTurn(players,playerTurn)
                    }, 5000);
                }
            })
        }

        if (players[playerTurn][0].includes('BOT')) {

            diceNumbers(diceResult);
            players[playerTurn][1].totalScore += throwScore;
    
            throwDiceAnimation(diceResult)
            displayThrowInfo(players[playerTurn], diceResult, throwScore, playerTurn)
            if (players[playerTurn][1].totalScore >= 151) {
                setTimeout(() => {
                    let winningMessage = 'Better luck next time.';
                    gameEnd(players[playerTurn][0], winningMessage)
                }, 5000);
            }
            else {
                setTimeout(() => {
                    playerTurn++;
                    if (playerTurn == players.length) {
                        playerTurn = 0;
                    }
                    nextPlayerTurn(players,playerTurn)
                }, 5000);
            }
        }
        function nextPlayerTurn(players,playerTurn) {
            displayBotTurnMessage(players[playerTurn])
            botGameLogic(players,playerTurn)
        }
        function displayThrowInfo(player, diceResult, throwScore) {
            let msg = '';
            let pointsNeededMessage = '';
            
            if (player === players[0]) {
                if (player[1].totalScore < 151) {
                    pointsNeededMessage =  '<br>You need ' + (151-player[1].totalScore) + ' more points to win!';
                }
                msg = 'You threw ' + diceResult + '<br>You got ' + throwScore + ' points!<br> Total score: ' + player[1].totalScore
            }
            else {
                msg = player[0] + ' threw ' + diceResult + '<br>' + player[0] + ' got ' + throwScore + " points!<br> " + player[0] + "'s Total score: " + player[1].totalScore;
            }
            document.getElementById('user-turn-info').innerHTML = msg.split(diceResult + '<br>')[0];
            setTimeout(() => {
                updateScoresUI(playerTurn, player[1].totalScore)
                document.getElementById('user-turn-info').innerHTML = msg.split('<br>')[1] + msg.split('<br>')[2] + pointsNeededMessage;
            }, 2000);
        }

        function updateScoresUI(playerTurn, playerScore) {
            document.getElementById('players-status-list').children[playerTurn].innerText = playerScore;
        }

        function gameEnd(winnerName, msg) {
            let modal = document.createElement('div');
            modal.classList.add('form-modal-popup','triggered')
            let winMessage = document.createElement('div');
            winMessage.classList.add('win-message')
            let leaveButton = document.createElement('a');
            leaveButton.href = '/';
            leaveButton.classList.add('red-button')
            leaveButton.innerText = 'Close game'
            winMessage.innerHTML = '<h1> ' + winnerName + ' won the game!<br>' + msg + '</h1> ' + leaveButton.outerHTML + '<span id="timeleft"></span>';
            document.querySelector('body').append(modal);
            document.querySelector('#game-container').append(winMessage);
            let secondsPassed = 15;
            var closeGame = setInterval(() => {
                if (secondsPassed === 0) {
                    clearInterval(closeGame)
                    window.location.replace("/");
                }
                else {
                    document.querySelector('#timeleft').innerText = 'You will be removed from lobby in ' + secondsPassed + ' seconds.';
                    secondsPassed--
                }
            }, 1000);
        }
    }
}
