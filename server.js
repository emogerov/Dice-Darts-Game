const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { read } = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.set('frontend', './frontend')
app.set('view engine', 'html')
app.engine('html', require('ejs').renderFile);
app.use(express.static('frontend'))
app.use(express.urlencoded({ extended: true }))

const rooms = {};

app.post('/gamelobby',function(req,res){
    if (rooms[req.body.gamelobby] != null) {
        let errorcode = encodeURIComponent('roomexists');
        return res.redirect('/?error=' + errorcode);
    }
    let lobbyMaxPlayers = req.body.lobbysize;
    if (req.body.lobbyprivate) {
        let isLobbyPrivate = true;
        let lobbyPassword = req.body.lobbypassword;
        rooms[req.body.gamelobby] = { users: {}, settings: 
            {   lobbysize: lobbyMaxPlayers, 
                privatelobby: isLobbyPrivate,
                lobbypassword: lobbyPassword
            },
            readyusers: [],
            ingamestate: false
        };
    }
    else {
        rooms[req.body.gamelobby] = { users: {}, settings: {lobbysize: lobbyMaxPlayers}, readyusers: [], ingamestate: false };
    }
    res.redirect(req.body.gamelobby)
});

app.get('/:gamelobby', (req, res) => {
    if (rooms[req.params.gamelobby] == null) {
        return res.redirect('/')
    }
    if (parseInt(Object.entries(rooms[req.params.gamelobby].users).length) === parseInt(rooms[req.params.gamelobby].settings.lobbysize)) {
        let errorcode = encodeURIComponent('fullroom');
        return res.redirect('/?error=' + errorcode);
    }
    if (rooms[req.params.gamelobby].ingamestate === true) {
        let errorcode = encodeURIComponent('startedroom');
        return res.redirect('/?error=' + errorcode);
    }
    res.render('gamelobby', { gameLobby: req.params.gamelobby })
})
let scores = [];
io.on('connection', socket => {
    let roomsToShow = JSON.parse(JSON.stringify(rooms));
    checkForFullRooms(roomsToShow);
    checkForStartedRooms(roomsToShow);
    let userStatus = false;


    socket.on('user-connected-to-lobby', (room) => {
        if (rooms[room].settings.privatelobby === true) {
            socket.emit('roomcode-required', rooms[room])
            socket.on('roomcode-success', (room) => {
                socket.join(room)
                let socketUsername = 'Guest' + Math.random().toString().slice(2,11);
                if (rooms[room].readyusers.length === parseInt(Object.entries(rooms[room].users).length)) {
                    io.to(room).emit('all-users-ready-message', 'All players must be "Ready".');
                }
                rooms[room].users[socket.id] = socketUsername;
                io.to(room).emit('user-connected', rooms[room].users, rooms[room].readyusers);
                socket.to(room).emit('user-connected-chat', socketUsername);
                roomsToShow = JSON.parse(JSON.stringify(rooms));
                checkForFullRooms(roomsToShow);
                checkForStartedRooms(roomsToShow);
                io.emit('games-list', roomsToShow);
                getGameHost(room)
                socket.emit('press-ready-message', 'Press the "Ready" button');
            })
        }
        else {
            socket.emit('roomcode-notrequired', room)
            socket.join(room)
                let socketUsername = 'Guest' + Math.random().toString().slice(2,11);
                if (rooms[room].readyusers.length === parseInt(Object.entries(rooms[room].users).length)) {
                    io.to(room).emit('all-users-ready-message', 'All players must be "Ready".');
                }
                rooms[room].users[socket.id] = socketUsername;
                io.to(room).emit('user-connected', rooms[room].users, rooms[room].readyusers);
                socket.to(room).emit('user-connected-chat', socketUsername);
                roomsToShow = JSON.parse(JSON.stringify(rooms));
                checkForFullRooms(roomsToShow);
                checkForStartedRooms(roomsToShow);
                io.emit('games-list', roomsToShow);
                getGameHost(room)
                socket.emit('press-ready-message', 'Press the "Ready" button');
        }
    })
    socket.on('send-chat-message', (room, message) => {
        socket.to(room).emit('chat-message', { message: message, name: rooms[room].users[socket.id] })
    })
    socket.on('disconnect', () => {
        getUserRooms(socket).forEach(room => {
            if (rooms[room].ingamestate === true) {
                rooms[room].users[socket.id] = rooms[room].users[socket.id].replace('Guest','Bot')
            }
            else {
                rooms[room].readyusers = rooms[room].readyusers.filter(value => value !== rooms[room].users[socket.id])
                delete rooms[room].users[socket.id];
                if (rooms[room].readyusers.length === parseInt(Object.entries(rooms[room].users).length)) {
                    io.to(room).emit('waiting-for-host-message', 'Waiting for host to start.');
                }
                roomsToShow = JSON.parse(JSON.stringify(rooms));
                checkForFullRooms(roomsToShow);
                checkForStartedRooms(roomsToShow);
                checkForEmptyRooms(roomsToShow);
                if (parseInt(Object.entries(rooms[room].users).length) == 0) {
                    delete rooms[room]
                    io.emit('games-list', roomsToShow);
                }
                else {
                    getGameHost(room)
                    io.emit('games-list', roomsToShow);
                }
            }
            socket.to(room).emit('user-disconnected', rooms[room].users[socket.id], rooms[room].ingamestate, rooms[room], scores)
        })
    })
    socket.on('start-game-button-pressed', room => {
        let usersCount = Object.keys(rooms[room].users).length;
        let maxUsersAllowed = parseInt(Object.values(rooms[room].settings.lobbysize));
        let readyPlayersNumber = rooms[room].readyusers.length;
        let message = '';

        if (usersCount > 1 && usersCount === readyPlayersNumber) {
            if (usersCount < maxUsersAllowed) {
                message = "Room is NOT full! Are you sure you want to start game with " + usersCount + " players?";
                socket.emit('starting-game-lobby-notfull', message)
            }
            else {
                message = "Game is starting!"
                io.to(room).emit('starting-game-lobby-full', message)
            }
        }
        else if (usersCount > 1 && usersCount != readyPlayersNumber) {
            message = "Cannot start game! All players must be ready.";
            socket.emit('players-not-ready', message)
        }
        else {
            message = 'Cannot start game! Minimum 2 players required.'
            socket.emit('not-enough-players', message)
        }
    })
    socket.on('user-status-change', (user,roomname) => {
        if (userStatus === true) {
            userStatus = false;
            if (rooms[roomname].readyusers.length === parseInt(Object.entries(rooms[roomname].users).length)) {
                io.to(roomname).emit('all-users-ready-message', 'All players must be "Ready".');
            }
            rooms[roomname].readyusers.splice(rooms[roomname].users[user],1)
            io.to(roomname).emit('user-not-ready', rooms[roomname].users[user]);
            socket.emit('press-ready-message', 'Press the "Ready" button');
        }
        else {
            userStatus = true;
            rooms[roomname].readyusers.push(rooms[roomname].users[user])
            io.to(roomname).emit('user-is-ready', rooms[roomname].users[user]);
            if (rooms[roomname].readyusers.length === parseInt(Object.entries(rooms[roomname].users).length)) {
                io.to(roomname).emit('waiting-for-host-message', 'Waiting for host to start.');
            }
            else {
                socket.emit('all-users-ready-message', 'All players must be "Ready".');
            }
        }
    })
    socket.on('game-started-by-host', room => {
        rooms[room].ingamestate = true;
        let message = "Game started";
        let playersScores = Object.keys(rooms[room].users);

        for (var i = 0; i < Object.keys(playersScores).length; i++) {
            playersScores[i] = [playersScores[i], {totalScore: 0}]
        }
        io.to(room).emit('game-started', rooms[room],message, playersScores)
        roomsToShow = JSON.parse(JSON.stringify(rooms));
        checkForStartedRooms(roomsToShow);
        checkForFullRooms(roomsToShow);
        checkForEmptyRooms(roomsToShow);
        io.emit('games-list', roomsToShow);
    })
    socket.on('display-user-results', (diceResult, throwScore, playerTotalScore, playerId, roomname) => {
        let pointsNeededMessage = ''
        if (playerTotalScore < 151) {
            pointsNeededMessage =  '<br>You need ' + (151-playerTotalScore) + ' more points to win!';
        }
        let currentPlayer = rooms[roomname].users[playerId]
        if (currentPlayer.includes('Bot')) {
            io.to(roomname).emit('user-turn-result-message', currentPlayer + ' threw ' + diceResult + '<br>' + currentPlayer + ' got ' + throwScore + " points!<br> " + currentPlayer + "'s Total score: " + playerTotalScore, '', diceResult, currentPlayer, playerTotalScore)
        }
        else {
            socket.to(roomname).emit('user-turn-result-message', currentPlayer + ' threw ' + diceResult + '<br>' + currentPlayer + ' got ' + throwScore + " points!<br> " + currentPlayer + "'s Total score: " + playerTotalScore, '', diceResult, currentPlayer, playerTotalScore)
        }
        io.to(playerId).emit('user-turn-result-message', 'You threw ' + diceResult + '<br>You got ' + throwScore + ' points!<br> Total score: ' + playerTotalScore, pointsNeededMessage, diceResult, currentPlayer, playerTotalScore);
    })
    socket.on('user-turn-finished', (room, playerTurn, playersScores, roomname) => {
        scores = playersScores;
        io.to(roomname).emit('next-turn', rooms[roomname], playerTurn, playersScores)
    })
    socket.on('game-ended', (player, playerId, roomname) => {
        if (player.includes('Bot')) {
            io.to(roomname).emit('game-ended-screen', player, 'Better luck next time.');
        }
        else {
            socket.to(roomname).emit('game-ended-screen', player, 'Better luck next time.')
            io.to(playerId).emit('game-ended-screen', player, 'Congratz, you smashed them!!!');
        }
    })
    socket.on('remove-room', roomname => {
        delete rooms[roomname]
    })
    io.emit('games-list', roomsToShow);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

function checkForFullRooms(roomsToShow) {
    for (let[roomname] of Object.entries(roomsToShow)) {
        if (parseInt(Object.entries(roomsToShow[roomname].users).length) === parseInt(roomsToShow[roomname].settings.lobbysize)) {
            roomsToShow[roomname].fullroom = true;
        }
    }
}
function checkForEmptyRooms(roomsToShow) {
    for (let[roomname] of Object.entries(roomsToShow)) {
        if (parseInt(Object.entries(roomsToShow[roomname].users).length) === 0) {
            roomsToShow[roomname].emptyroom = true;
        }
    }
}
function checkForStartedRooms(roomsToShow) {
    for (let[roomname] of Object.entries(roomsToShow)) {
        if (roomsToShow[roomname].ingamestate === true) {
            delete roomsToShow[roomname];
        }
    }
}
function getGameHost(roomname) {
    const gameHost = Object.values(rooms[roomname].users)[0].toString();
    io.to(roomname).emit('game-host-determined', gameHost, Object.keys(rooms[roomname].users)[0])
}
function getUserRooms(socket) {
    return Object.entries(rooms).reduce((names, [name, room]) => {
        if (room.users[socket.id] != null) names.push(name)
        return names
    }, [])
}