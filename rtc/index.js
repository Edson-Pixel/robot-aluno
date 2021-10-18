var getUserMedia
var myStream
var socket
var token
var query = location.search.slice(1);
var partes = query.split('&');
partes.forEach(function (parte) {
    var chaveValor = parte.split('=');
    var chave = chaveValor[0];
    var valor = chaveValor[1];
    if (chave == 'token') {
        token = valor
    }
});
const users = new Map()
const EVENT_VerifyStackCurrent = 'VerifyStackCurrent'
const EVENT_RedirectUser = 'RedirectUser'

document.addEventListener('DOMContentLoaded', function () {

    navigator.mediaDevices.getUserMedia({
        audio: true
    })
        .then(function () {
            enterInRoom()
        }).catch(function (err) {
            enterInRoom()
            //"tela de erro"
            console.log("tela de erro: "+err)
        })
}, false)
function initServerConnection(room) {
    var socket = io({
        query: {
            room: room
        }
    })
    
    setTimeout(function () {
        if (token) {
            socket.emit(EVENT_VerifyStackCurrent, { token: token, id: socket.id })
        }
    }, 1000)
    socket.on(EVENT_RedirectUser,()=>{
        document.location.href = document.location.origin +'/stack/?'+ location.search.slice(1)
    })
    socket.on('disconnect-user', function (data) {
        var user = users.get(data.id)
        if (user) {
            users.delete(data.id)
            user.selfDestroy()
        }
    })
    socket.on('call', function (data) {
        let user = new User(data.id)
        user.pc = createPeer(user)
        console.log(user.pc);
        users.set(data.id, user)
        createOffer(user, socket)

    })

    socket.on('offer', function (data) {
        var user = users.get(data.id)
        if (user) {
            answerPeer(user, data.offer, socket)
        } else {
            let user = new User(data.id)
            user.pc = createPeer(user)
            users.set(data.id, user)
            answerPeer(user, data.offer, socket)
        }
    })

    socket.on('answer', function (data) {
        var user = users.get(data.id)
        if (user) {
            user.pc.setRemoteDescription(data.answer)
        }
    })

    socket.on('candidate', function (data) {
        var user = users.get(data.id)
        if (user) {
            user.pc.addIceCandidate(data.candidate)
        } else {
            let user = new User(data.id)
            user.pc = createPeer(user)
            user.pc.addIceCandidate(data.candidate)
            users.set(data.id, user)
        }
    })

    socket.on('connect', function () {
        console.log(users);
        showPlayers()
    })

    socket.on('connect_error', function (error) {
        console.log('Connection ERROR!')
        console.log(error)
        leave()
    })

    return socket
}

function enviarMsgForServer(msgCMD) {
    broadcastChatMessage(msgCMD)
}

function broadcastChatMessage(msgCMD) {
    var message = msgCMD
    for (var user of users.values()) {
        user.sendMessage(message)
    }
}

function enterInRoom() {
    socket = initServerConnection("IOT_ROBOT")
}

function leave() {
    socket.close()
    for (var user of users.values()) {
        user.selfDestroy()
    }
    users.clear()
}