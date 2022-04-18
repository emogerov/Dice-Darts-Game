const socket = io();

const gamesList = document.getElementById('games-list');
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

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
                    if (gamesList.children.length === 1) {
                        closeGameListIfEmpty()
                    }
                }
            }
            // Remove empty rooms from games list
            if (rooms[roomname].emptyroom === true) {
                if (gamesList.querySelector("[data-roomid="+ roomname.replace(' ','') +"]")) {
                    gamesList.querySelector("[data-roomid="+ roomname.replace(' ','') +"]").remove();
                    if (gamesList.children.length === 1) {
                        closeGameListIfEmpty()
                    }
                }
            }
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
    const codeEntered = prompt('Enter code for private room.')
    if (codeEntered === Object.values(room.settings)[2]) {
        socket.emit('roomcode-success', gameLobby)
    }
    else {
        window.alert("Wrong code. Please try again.")
        window.location.href = "/";
    }
})
if (messageForm != null) {
    appendMessage('You joined')
    console.log(gameLobby)
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
socket.on('user-connected', name => {
    appendMessage(`${name} connected`);
})

socket.on('user-disconnected', name => {
    appendMessage(`${name} disconnected`);
})

function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageContainer.appendChild(messageElement);
}