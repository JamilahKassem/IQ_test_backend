const { setTimeout: sleep } = require('timers/promises');

let question_id = 0;
let question_image = 0;
let question_number_answers = 0;
let active = false;
const portSocket = 9002;

const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: portSocket });
let phase = 0, NumberOfUsers = 0, NAdmins = 0, Requests = 0;
const phases = ["No Admin", "Admin connected", "Started", "Finished"]

async function EndQuestion(time)
{
    await sleep(time*100);
    active = false;
    broadcast({type:"Pause"});
}

wss.on('connection', (socket) =>
{
    Requests++;
    NumberOfUsers++;
    WD();
    if (active) {
        socket.send(JSON.stringify({
            type: "Next",
            question_id: question_id,
            question_image: question_image,
            question_number_answers: question_number_answers
        }));
    } else {
        socket.send(JSON.stringify({type: "Pause"}));
    }
    socket.on('close', () => {
        NumberOfUsers--;
        WD();
    });
    socket.on('error', (err) => {
        console.error("Socket error:", err);
    });
});
wss.on('NextQuestion', (data) =>
{
    let parsed_data = JSON.parse(data.toString());
    active = true;
    question_id = parsed_data.question_id;
    question_image = parsed_data.question_image;
    question_number_answers = parsed_data.question_number_answers;
    broadcast({
        type: "Next",
        id: question_id,
        image: question_image,
        time: parsed_data.time,
        number_answers: question_number_answers
    });
    EndQuestion(parseInt(parsed_data.time)).catch(err => {console.error("EndQuestion error:", err);});
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