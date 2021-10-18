function showLoading() {
    showPanel('loading')
    hidePanel('players')
}

function showPlayers() {
    hidePanel('loading')
    showPanel('players')
}

function addVideoPlayer(stream) {
    var template = new DOMParser().parseFromString('<div class=""><div><video autoplay style="width: 100vw; height: 100vh;"></video></div></div>', 'text/html')
    template.getElementsByTagName('video')[0].srcObject = stream
    var  divPlayer = template.body.childNodes[0]
    document.getElementById('players-row').appendChild(divPlayer)
    return divPlayer
}

function hidePanel(name) {
    document.getElementById(name).classList.add("hide")
}

function showPanel(name) {
    document.getElementById(name).classList.remove("hide")
}

