const http = require('http');
const express = require('express');
const socketio = require('socket.io');

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
        return res.redirect('/')
    }
    let lobbyMaxPlayers = req.body.lobbysize;
    if (req.body.lobbyprivate) {
        let isLobbyPrivate = true;
        let lobbyPassword = req.body.lobbypassword;
        rooms[req.body.gamelobby] = { users: {}, settings: 
            {   lobbysize: lobbyMaxPlayers, 
                privatelobby: isLobbyPrivate,
                lobbypassword: lobbyPassword
            } 
        };
    }
    else {
        rooms[req.body.gamelobby] = { users: {}, settings: {lobbysize: lobbyMaxPlayers} };
    }
    res.redirect(req.body.gamelobby)
});

app.get('/:gamelobby', (req, res) => {
    if (rooms[req.params.gamelobby] == null) {
        return res.redirect('/')
    }
    if (parseInt(Object.entries(rooms[req.params.gamelobby].users).length) === parseInt(rooms[req.params.gamelobby].settings.lobbysize)) {
        return res.redirect('/')
    }
    res.render('gamelobby', { gameLobby: req.params.gamelobby })
})

io.on('connection', socket => {
    let roomsToShow = JSON.parse(JSON.stringify(rooms));
    checkForFullRooms(roomsToShow);

    socket.on('user-connected-to-lobby', (room) => {
        if (rooms[room].settings.privatelobby === true) {
            socket.emit('roomcode-required', rooms[room])
            socket.on('roomcode-success', (room) => {
                socket.join(room)
                let socketUsername = 'Guest' + Math.random().toString().slice(2,11);
                rooms[room].users[socket.id] = socketUsername;
                socket.to(room).emit('user-connected', socketUsername);
                roomsToShow = JSON.parse(JSON.stringify(rooms));
                checkForFullRooms(roomsToShow);
                io.emit('games-list', roomsToShow);
            })
        }
        else {
            socket.join(room)
            let socketUsername = 'Guest' + Math.random().toString().slice(2,11);
            rooms[room].users[socket.id] = socketUsername;
            socket.to(room).emit('user-connected', socketUsername);
            roomsToShow = JSON.parse(JSON.stringify(rooms));
            checkForFullRooms(roomsToShow);
            io.emit('games-list', roomsToShow);
        }
    })
    socket.on('send-chat-message', (room, message) => {
        socket.to(room).emit('chat-message', { message: message, name: rooms[room].users[socket.id] })
    })
    socket.on('disconnect', () => {
        getUserRooms(socket).forEach(room => {
            socket.to(room).emit('user-disconnected', rooms[room].users[socket.id])
            delete rooms[room].users[socket.id];
            roomsToShow = JSON.parse(JSON.stringify(rooms));
            checkForFullRooms(roomsToShow);
            checkForEmptyRooms(roomsToShow);
            if (parseInt(Object.entries(rooms[room].users).length) == 0) {
                io.emit('games-list', roomsToShow);
                delete rooms[room]
            }
            else {
                io.emit('games-list', roomsToShow);
            }
        })
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
function getUserRooms(socket) {
    return Object.entries(rooms).reduce((names, [name, room]) => {
        if (room.users[socket.id] != null) names.push(name)
        return names
    }, [])
}