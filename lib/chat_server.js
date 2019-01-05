const socketio = require('socket.io');
const io;
let guestNumber = 1;
let nickNames = {};
let namesUsed = [];
let currentRoom = {};

exports.listen = (server) => {
    // Запуск Socket.IO сервера вместе с существующим HTTP сервером
    io = socketio.listen(server);
    io.set('log level', 1);
    // Определение способа обработки каждого пользовательского соединения
    io.sockets.on('connection', (socket) => {
        // Присваивание подключившемуся пользователю имени Guest
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
        // Помещение подключившегося пользователя в комнату Лобби
        joinRoom(socket, 'Lobby');
        //Обработка пользовательских сообщений
        handleMessageBroadcasting(socket, nickNames);
        //Обработка попытки изменить никнейм
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        //Обработка создания/подключения к комнате
        handleRoomJoining(socket);
        //Вывод списка занятых комнат по запросу пользователя
        socket.on('rooms', () => socket.emit('rooms', io.sockets.manager.rooms));
        //Определение логики очистки, выполняемой после выхода пользователя из чата
        handleClientDisconnection(socket, nickNames, namesUsed);

    })
};
const assignGuestName = (socket, guestNumber, nickNames, namesUsed) => {
    let name = 'Guest' + guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult', {
        success: true,
        name: name,
    });
    namesUsed.push(name);
    return guestNumber + 1;
};

const joinRoom = (socket, room) => {
    //Вход в комнату
    socket.join(room);
    //Обнаружение пользователя в данной комнате
    currentRoom[socket.id] = room;
    //Оповещение пользователя о том что он находится в данной комнате
    socket.emit('joinResult', {room: room});
    //Оповещение других пользователей о том что к ним подключился пользователь
    socket.broadcast.to(room).emit('message', {text: nickNames[socket.id] + ' подключился к ' + room + '!'});
    //Идентификация пользователей которые находятся в той же комнате
    let usersInRoom = io.sockets.clients(room);
    //Если в комнате больше 1 человека просуммировать их
    if (usersInRoom.length > 1) {
        let usersInRoomSummary = 'Количество пользователей в ' + room + ': ';
        for (index in usersInRoom) {
            let userSocketId = usersInRoom[index].id;
            if (userSocketId != socket.id) {
                if (index > 0) {
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
            usersInRoomSummary += '. ';
            socket.emit('message', {text: usersInRoomSummary});
        }
    }
};


