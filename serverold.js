require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const argon2= require('argon2');
const { setTimeout: sleep } = require('timers/promises');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
let questionId = 0;
let active = false;
let timeStart;
let counter = 1;

const portExpress = 9001;
const portSocket = 9002;

const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: portSocket });
let phase = 0, NumberOfUsers = 0, NAdmins = 0,Requests=0;
const phases = ["No Admin", "Admin connected", "Started", "Finished"]

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const db = pool.promise();

app.get('/questions/:uid', async (req, res) => {
    const userId = req.params.uid;
    const sql = "SELECT Q.Question, Q.NAns, R.Answer FROM question AS Q LEFT JOIN results AS R ON R.QID = Q.ID AND R.ID = ? WHERE Q.ID = ?";
    try {
        const [rows] = await db.query(sql, [userId, questionId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Question not found" });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

app.get('/next', async (req, res) => {
    const sql = "SELECT id,T FROM question WHERE id > ? AND Active = TRUE ORDER BY id ASC LIMIT 1";
    try {
        const [rows] = await db.query(sql, [questionId]);
        if (rows.length === 0) {
            broadcast({type:"End"});
        }else{
            timeStart = Date.now();
            active = true;
            counter = counter + 1;
            questionId = rows[0].id;
            broadcast({type:"Next",a:questionId});
            EndQuestion(parseInt(rows[0].T)).catch(err => {console.error("EndQuestion error:", err);});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

async function EndQuestion(time) {
    await sleep(time*100);
    active = false;
    broadcast({type:"Pause",a:counter});
}

app.post('/Answer', async (req, res) => {
    let { uid, answer } = req.body;
    const sql = "INSERT INTO results(`ID`,`QID`,`Time`,`Answer`) VALUES (?,?,?,?) " +
        "ON DUPLICATE KEY UPDATE `Time` = VALUES(`Time`), `Answer` = VALUES(`Answer`)";
    try {
        let timeCurrent = Date.now();
        const [result] = await db.query(sql, [parseInt(uid),questionId,timeCurrent - timeStart,parseInt(answer)]);
        if (result.affectedRows === 1) {
            res.json({success:true});
        }else{
            res.json({success:false});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

app.post('/login', async (req, res) => {
    let { uid, password,admin } = req.body;
    if (admin){uid=0;}
    const sql = "SELECT Name,School,password FROM compatetent WHERE ID = ? LIMIT 1";
    try {
        const [rows] = await db.query(sql, [uid]);
        if (rows.length === 0) {
            res.json({success: false});
            return;
        }
        const valid = await argon2.verify(rows[0].password, password);
        if (valid) {
            res.json({Name: rows[0].Name,School: rows[0].School, success: true});
        } else {
            res.json({success: false});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});


app.post('/signup', async (req, res) => {
    const { uid, password } = req.body;
    console.log(password);
    const sql = "SELECT Name,School,password FROM compatetent WHERE ID = ? LIMIT 1";
    try {
        const [rows] = await db.query(sql, [uid]);
        if (rows.length === 0) {
            res.json({success: false});
            return;
        }
        const hashed = await argon2.hash(password);
        const valid = await argon2.verify(password, rows[0].password);
        console.log(valid);
        if (valid) {
            res.json({Name: rows.Name,School: rows.School, success: true});
        } else {
            res.json({success: false});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

app.listen(portExpress, () => {
    console.log(`Express server started Listening to port ${portExpress}`);
    console.log(`Socket server started Listening to port ${portSocket}`);
    WD();
});

wss.on('connection', (socket) => {
    Requests++;NumberOfUsers++;WD();
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