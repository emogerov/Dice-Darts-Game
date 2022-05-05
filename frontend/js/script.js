const socket = io();

const gamesList = document.getElementById('games-list');
const chatContainer = document.getElementById('chat-container');
const chatForm = document.getElementById('send-container');
const chatInput = document.getElementById('chat-input');
const gamePageContainer = document.getElementById('game-page-container');
const gameWindowContainer = document.getElementById('game-window-container');
const playersNamesList = document.getElementById('players-names-list');
const playersStatusList = document.getElementById('players-status-list');
const gameMessageContainer = document.getElementById('user-turn-info');

socket.on('games-list', rooms => {
    if (Object.keys(rooms).length > 0 && gamesList) {
        if (document.querySelector('.no-games-msg')) {
            gamesList.classList.remove('open-flex');
            document.querySelector('.no-games-msg').remove();
        }
        if (!document.querySelector('.game-list-table-head')) {
            let gameListHead = document.createElement('div');
            gameListHead.classList.add('game-list-table-head');
            gameListHead.innerHTML = "<span>LOBBY NAME</span><span>ROOM TYPE</span><span>PLAYERS IN LOBBY</span><span>JOIN LINK</span>";
            gamesList.insertBefore(gameListHead,gamesList.firstElementChild)
        }
        for (let [roomname,users] of Object.entries(rooms)) {
            const roomText = document.createElement('span');
            roomText.innerText = roomname;
            const roomLink = document.createElement('a');
            roomLink.href = `/${roomname}`;
            roomLink.innerText = 'JOIN';
            const roomType = document.createElement('span');
            if (Object.values(users.settings)[1] && Object.values(users.settings)[1] === true) {
                roomType.innerText = 'PRIVATE';
            }
            else {
                roomType.innerText = 'OPEN';
            }
            const roomPlayers = document.createElement('span');
            roomPlayers.innerText = Object.entries(users.users).length + ' / ' + Object.values(users.settings)[0];

            const roomElementContainer = document.createElement('div');
            roomElementContainer.dataset.roomid = roomname.replace(' ','');
            roomElementContainer.append(roomText,roomType,roomPlayers,roomLink);

            // Correctly display rooms available
            if (gamesList.querySelector("[data-roomid="+ roomname.replace(' ','') +"]")) {
                gamesList.querySelector("[data-roomid="+ roomname.replace(' ','') +"]").remove();
                gamesList.insertBefore(roomElementContainer,gamesList.firstElementChild.nextElementSibling)
            }
            else {
                gamesList.insertBefore(roomElementContainer,gamesList.firstElementChild.nextElementSibling)
            }

            // Remove full rooms from games list
            if (rooms[roomname].fullroom === true) {
                if (gamesList.querySelector("[data-roomid="+ roomname.replace(' ','') +"]")) {
                    gamesList.querySelector("[data-roomid="+ roomname.replace(' ','') +"]").remove();
                }
            }
            // Remove empty rooms from games list
            if (rooms[roomname].emptyroom === true) {
                if (gamesList.querySelector("[data-roomid="+ roomname.replace(' ','') +"]")) {
                    gamesList.querySelector("[data-roomid="+ roomname.replace(' ','') +"]").remove();
                }
            }
        }
        if (gamesList.children.length === 1) {
            closeGameListIfEmpty()
        }
    }
    else {
        if (gamesList) {
            closeGameListIfEmpty()
        }
    }
})
function closeGameListIfEmpty() {
    gamesList.classList.remove('opened');
    if (!document.querySelector('form#gamelobby').classList.contains('open-flex')) {
        document.querySelector('.form-modal-popup').classList.remove('triggered');
    }
    gamesList.innerHTML = "<span class='no-games-msg' >No games found</span>";
}
socket.on('roomcode-required', room => {
    if (Object.entries(room.users).length > 0) {
        const codeEntered = prompt('Enter code for private room.')
        if (codeEntered === Object.values(room.settings)[2]) {
            socket.emit('roomcode-success', gameLobby);
            gamePageContainer.style.opacity = 1;
            gamePageContainer.style.visibility = 'visible';
        }
        else {
            window.alert("Wrong code. Please try again.")
            window.location.href = "/";
        }
    }
    else {
        socket.emit('roomcode-success', gameLobby);
        gamePageContainer.style.opacity = 1;
        gamePageContainer.style.visibility = 'visible';
    }
})
socket.on('roomcode-notrequired', room => {
    gamePageContainer.style.opacity = 1;
    gamePageContainer.style.visibility = 'visible';
})
if (chatForm != null) {
    appendMessage('You joined')
    socket.emit('user-connected-to-lobby', gameLobby)
    
    chatForm.addEventListener('submit', e => {
        e.preventDefault()
        const message = chatInput.value
        appendMessage(`You: ${message}`)
        socket.emit('send-chat-message', gameLobby, message)
        chatInput.value = ''
    })
}
socket.on('chat-message', data => {
    appendMessage(`${data.name}: ${data.message}`)
})
socket.on('user-connected', (usersList, readyPlayers) => {
    let namesList = '';
    let statusList = '';
    for (let guestname of Object.values(usersList)) {
        let newPlayer = document.createElement('li');
        newPlayer.innerText = guestname;
        newPlayer.dataset.playername = guestname;
        let newPlayerStatus = document.createElement('li');
        if (!readyPlayers.includes(guestname)) {
            newPlayerStatus.classList.add('player-unready');
        }
        else {
            newPlayerStatus.classList.add('player-ready');
        }
        newPlayerStatus.dataset.playername = guestname;

        namesList += newPlayer.outerHTML;
        statusList += newPlayerStatus.outerHTML
    }

    playersNamesList.innerHTML = namesList;
    playersStatusList.innerHTML = statusList;

    playersNamesList.querySelector("[data-playername="+ usersList[socket.id] +"]").classList.add('you')
})
socket.on('user-connected-chat', name => {
    appendMessage(`${name} connected`);
})
socket.on('game-host-determined', (host, hostId) => {
    playersNamesList.querySelector("[data-playername="+ host +"]").id = 'gamehost';
    if (hostId === socket.id) {
        if (!document.querySelector('#startgame-button')) {
            let startGameButton = document.createElement('button');
            startGameButton.id = 'startgame-button';
            startGameButton.classList.add('blue-button');
            startGameButton.innerText = 'Start Game';
            gameWindowContainer.append(startGameButton)
            startGameButton.addEventListener('click', function() {
                socket.emit('start-game-button-pressed', gameLobby);
            })
        }
    }
})
socket.on('press-ready-message', msg => {
    gameMessageContainer.innerText = msg;
})
socket.on('all-users-ready-message', msg => {
    gameMessageContainer.innerText = msg;
})
socket.on('waiting-for-host-message', msg => {
    gameMessageContainer.innerText = msg;
});
socket.on('user-not-ready', name => {
    if (playersStatusList.querySelector("[data-playername="+ name +"]").classList.contains('player-ready')) {
        playersStatusList.querySelector("[data-playername="+ name +"]").classList.remove('player-ready');
    }
    playersStatusList.querySelector("[data-playername="+ name +"]").classList.add('player-unready');
})
socket.on('user-is-ready', name => {
    if (playersStatusList.querySelector("[data-playername="+ name +"]").classList.contains('player-unready')) {
        playersStatusList.querySelector("[data-playername="+ name +"]").classList.remove('player-unready');
    }
    playersStatusList.querySelector("[data-playername="+ name +"]").classList.add('player-ready');
})
socket.on('not-enough-players', msg => {
    gameMessageContainer.innerText = msg;
})
socket.on('players-not-ready', msg => {
    gameMessageContainer.innerText = msg;
})
socket.on('starting-game-lobby-notfull', msg => {
    document.querySelector('#startgame-button').style.display = 'none';
    gameMessageContainer.innerText = msg;
    gameMessageContainer.innerHTML = gameMessageContainer.innerHTML + displayConfirmationButtons();
    // No button
    gameMessageContainer.querySelector('#decline.red-button').addEventListener('click', function() {
        gameMessageContainer.innerHTML = '';
        document.querySelector('#startgame-button').style.display = 'block';
    })
    // Yes button
    gameMessageContainer.querySelector('#approve.blue-button').addEventListener('click', function() {
        if (document.querySelector('#startgame-button')) {
            document.querySelector('#startgame-button').remove()
        }
        socket.emit('game-started-by-host', gameLobby);
        gameMessageContainer.innerHTML = '';
    })
})
socket.on('starting-game-lobby-full', msg => {
    gameMessageContainer.innerText = msg;
    socket.emit('game-started-by-host', gameLobby);
})
socket.on('game-started', (room,msg,playersScores) => {
    if (document.querySelector('#startgame-button')) {
        document.querySelector('#startgame-button').remove()
    }
    updateGameInfoUI();
    let playerTurn = 0;
    gameMessageContainer.innerText = msg;
    gameMessageContainer.classList.add('countdown-transition')

    gameMessageContainer.addEventListener('animationend', function(event) {
        gameMessageContainer.innerText = '';
        gameMessageContainer.classList.remove('countdown-transition')
        gameStartedCountdown(playersScores[playerTurn][0], Object.values(room.users)[playerTurn], room, playerTurn, playersScores)
    });
})
function changePlayerStatus() {
    socket.emit('user-status-change', socket.id ,gameLobby)
}
function gameStartedCountdown(playerId, currentPlayer, room, playerTurn, playersScores) {
    let secondsPassed = 3;
    var interval = setInterval(() => {
        if (secondsPassed < 0) {
            displayTurnMessage(playerId, currentPlayer)
            gameLogic(room, playerTurn, playersScores);
            clearInterval(interval)
        }
        else if (secondsPassed === 0) {
            gameMessageContainer.innerText = 'GO';
            secondsPassed--
        }
        else {
            gameMessageContainer.innerText = secondsPassed;
            secondsPassed--
        }
    }, 1000);
}
function gameLogic(room,playerTurn,playersScores) {
    let players = JSON.parse(JSON.stringify(Object.keys(room.users)))
    let diceResult = [];
    if (players[playerTurn] === socket.id) {
        gameWindowContainer.firstElementChild.innerHTML = getGameWindowSetup();
        document.getElementById('throw-dice-button').addEventListener('click', function() {
            diceNumbers(diceResult);
            playersScores[playerTurn][1].totalScore += throwScore;
            
            this.remove()
            socket.emit('display-user-results', diceResult, throwScore, playersScores[playerTurn][1].totalScore, playersScores[playerTurn][0], gameLobby)
            if (playersScores[playerTurn][1].totalScore >= 151) {
                setTimeout(() => {
                    socket.emit('game-ended', Object.values(room.users)[playerTurn], playersScores[playerTurn][0], gameLobby)
                }, 5000);
            }
            else {
                setTimeout(() => {
                    playerTurn++;
                    if (playerTurn == players.length) {
                        playerTurn = 0;
                    }
                    socket.emit('user-turn-finished',room, playerTurn, playersScores, gameLobby)
                }, 5000);
            }
        })
    }
    
    if (room.users[players[playerTurn]].includes('Bot')) {
        diceNumbers(diceResult);
        playersScores[playerTurn][1].totalScore += throwScore;

        socket.emit('display-user-results', diceResult, throwScore, playersScores[playerTurn][1].totalScore, playersScores[playerTurn][0], gameLobby)
        if (playersScores[playerTurn][1].totalScore >= 151) {
            setTimeout(() => {
                socket.emit('game-ended', Object.values(room.users)[playerTurn], playersScores[playerTurn][0], gameLobby)
            }, 5000);
        }
        else {
            setTimeout(() => {
                playerTurn++;
                if (playerTurn == players.length) {
                    playerTurn = 0;
                }
                socket.emit('user-turn-finished',room, playerTurn, playersScores, gameLobby)
            }, 5000);
        }
    }
}
socket.on('user-turn-result-message', (msg, pointsMsg, dice, playerName, playerTotalScore) => {
    throwDiceAnimation(dice)
    gameMessageContainer.innerHTML = msg.split(dice + '<br>')[0];
    setTimeout(() => {
        // display basic rules /howto play
        updatePlayerScoresUI(playerName, playerTotalScore)
        gameMessageContainer.innerHTML = msg.split('<br>')[1] + msg.split('<br>')[2] + pointsMsg;
    }, 2000);
})
socket.on('next-turn', (room,playerTurn,playersScores) => {
    displayTurnMessage(playersScores[playerTurn][0], Object.values(room.users)[playerTurn])
    gameLogic(room,playerTurn,playersScores);
})
socket.on('game-ended-screen', (winnerName, msg) => {
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
    gamePageContainer.querySelector('#game-container').append(winMessage);
    let secondsPassed = 15;
    var closeGame = setInterval(() => {
        if (secondsPassed === 0) {
            clearInterval(closeGame)
            socket.emit('remove-room', gameLobby)
            window.location.replace("/");
        }
        else {
            document.querySelector('#timeleft').innerText = 'You will be removed from lobby in ' + secondsPassed + ' seconds.';
            secondsPassed--
        }
    }, 1000);

})
socket.on('user-disconnected', (name, gameStarted, room, playersScores) => {
    if (gameStarted === true) {
        var oldname = name.replace('Bot','Guest');
        if (playersNamesList.querySelector("[data-playername="+ oldname +"]")) {
            playersNamesList.querySelector("[data-playername="+ oldname +"]").innerText = name;
            playersNamesList.querySelector("[data-playername="+ oldname +"]").dataset.playername = name;
            playersStatusList.querySelector("[data-playername="+ oldname +"]").dataset.playername = name;
        }
        appendMessage(`${oldname} disconnected`);
        if (gameMessageContainer.innerText.includes(oldname)) {
            let playerTurn = Object.values(room.users).indexOf(name);
            gameLogic(room,playerTurn,playersScores)
        }
    }
    else {
        if (playersNamesList.querySelector("[data-playername="+ name +"]")) {
            playersNamesList.querySelector("[data-playername="+ name +"]").remove();
            playersStatusList.querySelector("[data-playername="+ name +"]").remove();
        }
        appendMessage(`${name} disconnected`);
    }
})
function displayTurnMessage(playerId, currentPlayer) {
    if (socket.id === playerId) {
        clearDice()
        gameMessageContainer.innerText =  "Your turn! Press the button to throw.";
    }
    else {
        clearDice()
        gameMessageContainer.innerText = "Waiting for " + currentPlayer + " to throw.";
    }
}
function diceNumbers(diceResult) {
    const diceNumber = 5;
    for (var i = 0; i < diceNumber; i++) {
        diceResult[i] =+ Math.floor(Math.random() * 6) + 1;
    }
    oddDice = diceResult.filter(num => num%2)
    throwScore = oddDice.reduce(function(a, b) { return a + b; }, 0);
    if (oddDice.length < 3) {
        throwScore = 0;
    }
    else {
        throwScore = throwScore*oddDice.length;
    }
    return {'diceResult' : diceResult,'throwScore' : throwScore};
}
function throwDiceAnimation(diceResult) {
    let dice = document.querySelector('.dice-container').children;
    
    for (var i = 0; i < dice.length; i++) {
        dice[i].classList.add('diceroll-' + diceResult[i])
    }
}
function clearDice() {
    let dice = document.querySelector('.dice-container').children;
    
    for (var i = 0; i < dice.length; i++) {
        dice[i].className = "";
    }
}
function getGameWindowSetup() {
    let throwButton = document.createElement('button');
    throwButton.classList.add('blue-button');
    throwButton.id = 'throw-dice-button';
    throwButton.innerText = "Throw dice";
    // to do: add dice, dice annimations, background, etc.
    let board = document.createElement('div')
    board.innerHTML = '<div class="game-background"></div><div class="dice-container"><div id="dice1"></div><div id="dice2"></div><div id="dice3"></div><div id="dice4"></div><div id="dice5"></div></div>'
    return board.innerHTML + throwButton.outerHTML
}
function displayConfirmationButtons() {
    let buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('message-buttons');
    let yesButton = document.createElement('button');
    yesButton.id = 'approve';
    yesButton.classList.add('blue-button');
    yesButton.innerText = "Yes";
    let noButton = document.createElement('button');
    noButton.id = 'decline';
    noButton.innerText = "No";
    noButton.classList.add('red-button');
    buttonsContainer.append(yesButton,noButton)

    return buttonsContainer.outerHTML
}
function updateGameInfoUI() {
    if (document.querySelector('#players-info button')) {
        document.querySelector('#players-info button').remove()
    }
    document.querySelector('#list-names-container').lastElementChild.innerText = 'Scores';
    
    for (var i = 0; i < playersStatusList.children.length; i++) {
        playersStatusList.children[i].classList.remove('player-ready');
        playersStatusList.children[i].classList.add('player-score');
        playersStatusList.children[i].innerText = 0;
    }
}
function updatePlayerScoresUI(playerName, playerScore) {
    if (playersStatusList.querySelector("[data-playername="+ playerName +"]")) {
        playersStatusList.querySelector("[data-playername="+ playerName +"]").innerText = playerScore;
    }
}
function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    chatContainer.appendChild(messageElement);
}