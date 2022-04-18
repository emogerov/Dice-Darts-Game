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
// Run when client connects
io.on('connection', socket => {
    let roomsToShow = JSON.parse(JSON.stringify(rooms));
    checkForFullRooms(roomsToShow);

    socket.on('user-joined-lobby', (room) => {
        console.log('joined')
        socket.join(room)
        let socketUsername = 'Guest' + Math.random().toString().slice(2,11);
        rooms[room].users[socket.id] = socketUsername;
        socket.to(room).emit('user-connected', socketUsername);
        roomsToShow = JSON.parse(JSON.stringify(rooms));
        checkForFullRooms(roomsToShow);
        io.emit('games-list', roomsToShow);
    })
    socket.on('send-chat-message', (room, message) => {
        socket.to(room).emit('chat-message', { message: message, name: rooms[room].users[socket.id] })
    })
    // TO DO on user disconnect
    io.emit('games-list', roomsToShow);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

function checkForFullRooms(roomsToShow) {
    for (let[roomname] of Object.entries(roomsToShow)) {
        if (parseInt(Object.entries(roomsToShow[roomname].users).length) === parseInt(roomsToShow[roomname].settings.lobbysize)) {
            delete roomsToShow[roomname];
            io.emit('room-removed', roomname)
        }
    }
}