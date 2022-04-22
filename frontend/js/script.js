const socket = io();

const gamesList = document.getElementById('games-list');
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
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
if (messageForm != null) {
    appendMessage('You joined')
    socket.emit('user-connected-to-lobby', gameLobby)
    
    messageForm.addEventListener('submit', e => {
        e.preventDefault()
        const message = messageInput.value
        appendMessage(`You: ${message}`)
        socket.emit('send-chat-message', gameLobby, message)
        messageInput.value = ''
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
            newPlayerStatus.innerText = 'Not Ready';
        }
        else {
            newPlayerStatus.classList.add('player-ready');
            newPlayerStatus.innerText = 'Ready';
        }
        newPlayerStatus.dataset.playername = guestname;

        namesList += newPlayer.outerHTML;
        statusList += newPlayerStatus.outerHTML
    }
    playersNamesList.innerHTML = namesList;
    playersStatusList.innerHTML = statusList;
})
socket.on('user-connected-chat', name => {
    appendMessage(`${name} connected`);
})
socket.on('game-host-determined', host => {
    let startGameButton = document.createElement('button');
    startGameButton.id = 'startgame-button';
    startGameButton.classList.add('blue-button');
    startGameButton.innerText = 'Start Game';
    gameWindowContainer.append(startGameButton)
    startGameButton.addEventListener('click', function() {
        socket.emit('start-game-button-pressed', gameLobby);
    })
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
    playersStatusList.querySelector("[data-playername="+ name +"]").innerText = "Not Ready";
})
socket.on('user-is-ready', name => {
    playersStatusList.querySelector("[data-playername="+ name +"]").innerText = "Ready";
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
    gameMessageContainer.querySelector('.red-button').addEventListener('click', function() {
        gameMessageContainer.innerHTML = '';
        document.querySelector('#startgame-button').style.display = 'block';
    })
    // Yes button
    gameMessageContainer.querySelector('.blue-button').addEventListener('click', function() {
        socket.emit('game-started-by-host', gameLobby);
        gameMessageContainer.innerHTML = '';
        if (document.querySelector('#startgame-button')) {
            document.querySelector('#startgame-button').remove()
        }
    })
})
socket.on('starting-game-lobby-full', msg => {
    gameMessageContainer.innerText = msg;
    socket.emit('game-started-by-host', gameLobby);
    if (document.querySelector('#startgame-button')) {
        document.querySelector('#startgame-button').remove()
    }
})
socket.on('game-started', (room,msg,playersScores) => {
    gameMessageContainer.innerText = msg;
    gameLogic(room,playerTurn,playersScores);
})
socket.on('user-disconnected', name => {
    if (playersNamesList.querySelector("[data-playername="+ name +"]")) {
        playersNamesList.querySelector("[data-playername="+ name +"]").remove();
        playersStatusList.querySelector("[data-playername="+ name +"]").remove();
    }
    appendMessage(`${name} disconnected`);
})
function changePlayerStatus() {
    socket.emit('user-status-change', socket.id ,gameLobby)
}
let playerTurn = 0;
let diceResult = [];
function gameLogic(room,playerTurn,playersScores) {
    let players = JSON.parse(JSON.stringify(Object.keys(room.users)))

    if (players[playerTurn] === socket.id) {
        gameWindowContainer.firstElementChild.innerHTML = getGameWindowSetup();
        document.getElementById('throw-dice-button').addEventListener('click', function() {
            diceNumbers();
            playersScores[playerTurn][1].totalScore += throwScore;
            // check if players/room can be removed
            // if score < X states
            // dice number function 3 of a kind 4 of a kind and etc.
            console.log('Dice: ',diceResult)
            console.log('Throw score: ',throwScore)
            console.log('Player total score: ', playersScores[playerTurn][1].totalScore)
            playerTurn++;
            if (playerTurn == players.length) {
                playerTurn = 0;
            }
            this.remove()
            nextPlayer = players[playerTurn];
            socket.emit('user-turn-finished', nextPlayer, room, playerTurn, playersScores)
        })
    }
}
socket.on('your-turn', (room,playerTurn,playersScores) => {
    gameLogic(room,playerTurn,playersScores);
})
function diceNumbers() {
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
function getGameWindowSetup() {
    let throwButton = document.createElement('button');
    throwButton.classList.add('blue-button');
    throwButton.id = 'throw-dice-button';
    throwButton.innerText = "Throw dice";
    // to do: add dice, dice annimations, background, etc.
    return throwButton.outerHTML
}
function displayConfirmationButtons() {
    let buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('message-buttons');
    let yesButton = document.createElement('button');
    yesButton.classList.add('blue-button');
    yesButton.innerText = "Yes";
    let noButton = document.createElement('button');
    noButton.innerText = "No";
    noButton.classList.add('red-button');
    buttonsContainer.append(yesButton,noButton)

    return buttonsContainer.outerHTML
}
function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageContainer.appendChild(messageElement);
}