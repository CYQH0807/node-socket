var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server,
    wss = new WebSocketServer({
        port: 1234
    });
var uuid = require('node-uuid');
var clients = [];

function wsSend(type, client_uuid, message) {
    for (var i = 0; i < clients.length; i++) {
        var clientSocket = clients[i].ws;
        if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify({
                "type": type,
                "id": client_uuid,
                "message": message
            }));
        }
    }
}
wss.on('connection', function (ws, request) {
    var client_uuid = uuid.v4();
    let type = request.url.replace("/", '')
    console.log('type: ', type);

    if (type == 'client' || type == 'control') {
        clients.push({
            "id": client_uuid,
            "ws": ws,
        });
        //只有控制端和客户端才能进来
        ws.on('message', function (message) {
            console.log('message: ', type, message);
            wsSend(type, client_uuid, message);
        })
    } else {
        ws.close()
    }
    var closeSocket = function (customMessage) {
        for (var i = 0; i < clients.length; i++) {
            if (clients[i].id == client_uuid) {
                var disconnect_message;
                if (customMessage) {
                    disconnect_message = customMessage;
                } else {
                    disconnect_message = client_uuid + " has disconnected";
                }
                wsSend("notification", client_uuid, disconnect_message);
                clients.splice(i, 1);
            }
        }
    };
    ws.on('close', function () {
        closeSocket();
    });
    process.on('SIGINT', function () {
        console.log("Closing things");
        closeSocket('Server has disconnected');
        process.exit();
    });
});

console.log('socket 已启动');