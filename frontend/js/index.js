let selectModeButtons = document.querySelectorAll('.mode-selection-btn');
let singleplayerContainer = document.querySelector('.singleplayer-mode');
let multiplayerContainer = document.querySelector('.multiplayer-mode');

let createLobbyButton = document.querySelector('#new-game-btn');
let joinLobbyButton = document.querySelector('#join-game-btn');

let lobbySizeDropdown = document.querySelector('.lobbysize-dropdown');
let lobbySizeOptions = lobbySizeDropdown.lastElementChild.children;

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
    let form = document.querySelector('form#gamelobby');
    let modal = document.querySelector('.form-modal-popup')

    if (e.target.closest('.form-modal-popup.triggered') && form.classList.contains('open-flex')) {
        modal.classList.remove('triggered');
        form.classList.remove('open-flex')
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
    let message = "<span> TO DO </span>"
    this.parentElement.innerHTML = this.parentElement.innerHTML + message;
})