const { setTimeout: sleep } = require('timers/promises');

let questionId = 0;
let active = false;
let counter = 1;
const portSocket = 9002;

const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: portSocket });
let phase = 0, NumberOfUsers = 0, NAdmins = 0,Requests=0;
const phases = ["No Admin", "Admin connected", "Started", "Finished"]

async function EndQuestion(time)
{
    await sleep(time*100);
    active = false;
    broadcast({type:"Pause",a:counter});
}


wss.on('connection', (socket) =>
{
    Requests++;
    NumberOfUsers++;
    WD();
    if(active){socket.send(JSON.stringify({type:"Next", a:questionId}));}else{socket.send(JSON.stringify({type:"Pause",a:counter}));}
    socket.on('message', (data)=>{broadcast(JSON.parse(data.toString()));});
    socket.on('close',()=>{NumberOfUsers--;WD();});
    socket.on('error', (err)=>{console.error("Socket error:", err);});
});
const broadcast = (message) => {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {client.send(JSON.stringify(message));}
    });
};
function WD(){
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write('State: '+phases[phase]+' - Number of Users '+
        NumberOfUsers+' - Admins: '+NAdmins+' - Requests: '+Requests);
}

console.log(`Socket server started Listening to port ${portSocket}`);