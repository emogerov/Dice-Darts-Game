const socket = io();

const gamesList = document.getElementById('games-list');
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

let username;

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
                roomLink.addEventListener('click', e => {
                    const codeEntered = prompt('Enter code for private room.')
                    if (codeEntered === Object.values(users.settings)[2]) {
                        return true;
                    }
                    else {
                        window.alert("Wrong code. Please try again.")
                        e.preventDefault();
                    }
                })
            }
            else {
                roomType.innerText = 'OPEN';
            }
            const roomPlayers = document.createElement('span');
            roomPlayers.innerText = Object.entries(users.users).length + ' / ' + Object.values(users.settings)[0];

            const roomElementContainer = document.createElement('div');
            roomElementContainer.id = roomname;
            roomElementContainer.append(roomText,roomType,roomPlayers,roomLink);
            
            if (gamesList.querySelector("[id="+ roomname +"]")) {
                gamesList.querySelector("[id="+ roomname +"]").remove();
                gamesList.insertBefore(roomElementContainer,gamesList.firstElementChild.nextElementSibling)
            }
            else {
                gamesList.insertBefore(roomElementContainer,gamesList.firstElementChild.nextElementSibling)
            }
        }
    }
    else {
        if (gamesList) {
            gamesList.classList.remove('opened');
            document.querySelector('.form-modal-popup').classList.remove('triggered');
            gamesList.innerHTML = "<span class='no-games-msg' >No games found</span>";
        }
    }
})
socket.on('room-removed', roomname => {
    if (gamesList.querySelector("[id="+ roomname +"]")) {
        gamesList.querySelector("[id="+ roomname +"]").remove();
    }
})
if (messageForm != null) {
    appendMessage('You joined')
    socket.emit('user-joined-lobby', gameLobby)
  
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
/* TO DO
socket.on('user-disconnected', name => {
    appendMessage(`${name} disconnected`);
})*/

function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageContainer.appendChild(messageElement);
}
