var getUserMedia
var myStream
var streamYt
var socket
var token
var timeEndInterval
var query = location.search.slice(1);
var partes = query.split('&');
partes.forEach(function (parte) {
    var chaveValor = parte.split('=');
    var chave = chaveValor[0];
    var valor = chaveValor[1];
    if (chave == 'token') {
        token = valor
    }
    if (chave == 'stream') {
        streamYt = valor
        document.getElementsByTagName('iframe')[0].src = streamYt
    }
});

if (document.cookie == "statusFila=true") {
    document.getElementsByClassName("btn-fila")[0].classList.add("onePessoa")
    document.getElementById("Wait").innerHTML = 'Aguarde sua vez'
}

const users = new Map()
const EVENT_InputStack = 'PeopleInputStack'
const EVENT_VerifyStack = 'VerifyStack'
const EVENT_CallCurrentPerson = 'CallCurrentPerson'
const EVENT_ReloadStack = 'ReloadStack'
const EVENT_ExitCandidate = 'ExitCandidate'
const EVENT_ExitEnd = 'ExitEnd'
const EVENT_LaterEnd = 'LaterEnd'
const EVENT_ExitErrorInput = 'ExitErrorInput'

enterInRoom()

function initServerConnection(room) {

    var socket = io({
        query: {
            room: room
        }
    })

    setTimeout(function () {
        if (token) {
            socket.emit(EVENT_VerifyStack, { token: token, id: socket.id })
        }
    }, 1000)

    socket.on(EVENT_ReloadStack, function (data) {
        UpdateInterfaceStack(data)
    })

    socket.on(EVENT_VerifyStack, function (data) {
        UpdateInterfaceStack(data)
    })

    socket.on(EVENT_ExitEnd, function () {
        if (token) {
            socket.emit(EVENT_LaterEnd, { token: token, id: socket.id })
        }
    })

    socket.on(EVENT_CallCurrentPerson, function (data) {
        console.log("MsgDeRedirecionamento:", data.msg);
        document.cookie = "statusFila=false"
        document.getElementsByClassName("btn-fila")[0].classList.remove("onePessoa")
        document.location.href = document.location.origin + '/Client.html?' + location.search.slice(1)
    })

    socket.on('disconnect-user', function (data) {
        var user = users.get(data.id)
        if (user) {
            users.delete(data.id)
            user.selfDestroy()
        }
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

    
    socket.on(EVENT_ExitErrorInput, function (data) {
        console.log('token invalido');
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
        console.log('Comunicação sincronizada')
    })

    socket.on('connect_error', function (error) {
        console.log('Connection ERROR!')
        console.log(error)
    })

    return socket
}

function enterInRoom() {
    socket = initServerConnection("IOT_ROBOT")
}

function updateTime(timeEnd) {
    timeEndInterval = timeEnd
    setInterval(function () {
        var timeUtcEnd = new Date(timeEndInterval).getTime()
        var timeUtcStart = new Date(new Date().toUTCString()).getTime()
        var timeUp = timeUtcEnd - timeUtcStart
        if (!document.getElementById('time-group')) {
            return
        }
        if (timeUp <= 0) {
            document.getElementById('time-group').innerHTML = `<div id="time-group"></div>`
            clearInterval(0)
            return
        }
        document.getElementById('time-group').innerHTML = `<div id="time-group">${new Date(timeUp).getMinutes()}min${new Date(timeUp).getSeconds()}s</div>`
    }, 750)

}

function broadcastChatMessage(e) {
    e.preventDefault()

    var message = document.getElementById('inputChatMessage').value

    addMessage(message)

    for (var user of users.values()) {
        user.sendMessage(message)
    }

    document.getElementById('inputChatMessage').value = ''
}

function UpdateInterfaceStack(data) {
    console.log("EVENT_VerifyStack => Fila Completa", data.Stack);
    console.log("EVENT_VerifyStack => Pessoa atual:", data.CurrentPerson_Now);

    // Entrado de usuario
    document.getElementById("now-realTime").innerHTML = ""
    if (data.CurrentPerson_Now[0]) {
        var timeEnd = data.CurrentPerson_Now[0].timeEnd
        //Seja o Primeiro a Controlar
        document.getElementById("welcome-controle").innerHTML = ""
        document.getElementById("welcome-controle").classList.add('onePessoa')
        document.getElementById("now-realTime").classList.remove('onePessoa')
        document.getElementById("now-realTime").innerHTML = `
        <div class="status"></div>
        <div>${data.CurrentPerson_Now[0].name}</div>
        <div id="time-group"></div>`
        updateTime(timeEnd)
    } else {
        document.getElementsByClassName("pessoaFile")[0].classList.add('onePessoa')
        document.getElementById("welcome-controle").innerHTML = "Seja o Primeiro a Controlar"
        document.getElementById("welcome-controle").classList.remove('onePessoa')
    }

    if (data.func === 0) {
        console.log("Call function:", data.func);
        document.getElementById("onlyAwait").innerHTML = "<div id='onlyAwait'></div>";
        if (!data.Stack[0]) {
            return
        }
        for (let index = 0; index < data.Stack.length; index++) {
            document.getElementById("onlyAwait").innerHTML += `
                <div class="pessoa">
                    <div class="status"></div>
                    <div>${data.Stack[index].name}</div>
                </div>`
        }
    }
}

function InputStack() {
    document.cookie = "statusFila=true"
    document.getElementsByClassName("btn-fila")[0].classList.add("onePessoa")
    document.getElementById("Wait").innerHTML = 'Aguarde sua vez'
    document.getElementById("Wait").classList.remove('onePessoa')
    socket.emit(EVENT_InputStack, { token: token, id: socket.id })
}