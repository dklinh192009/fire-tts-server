const express = require('express');
const http = require('http'); 
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app); 
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const locations = {}; 
const clients = {};   

wss.on('connection', (ws) => {
    console.log('🔌 Có một thiết bị mới kết nối WebSocket!');
    ws.on('message', (message) => {
        const msg = message.toString();
        if (msg.startsWith('REGISTER:')) {
            const deviceID = msg.split(':')[1];
            clients[deviceID] = ws; 
            console.log(`✅ Đã ghi nhận thiết bị online: ${deviceID}`);
            if (locations[deviceID]) {
                ws.send(locations[deviceID]);
            }
        }
    });
    ws.on('close', () => console.log('❌ Một thiết bị đã ngắt kết nối.'));
});

// ================= API CHO WEBSITE =================

// CHỖ NÀY ĐÃ ĐƯỢC SỬA: Thay vì gửi text, nó sẽ gửi file giao diện index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// API lấy danh sách các ESP32 đang kết nối
app.get('/clients', (req, res) => {
    const onlineDevices = Object.keys(clients).filter(id => clients[id].readyState === WebSocket.OPEN);
    res.json({
        online: onlineDevices,
        locations: locations
    });
});

app.post('/updateLocation', (req, res) => {
    const { deviceID, location } = req.body;
    if (!deviceID || !location) return res.status(400).json({ error: 'Thiếu thông tin' });
    
    locations[deviceID] = location;
    console.log(`\n📍 Cập nhật vị trí cho [${deviceID}]: ${location}`);

    if (clients[deviceID] && clients[deviceID].readyState === WebSocket.OPEN) {
        clients[deviceID].send(location);
    }
    res.json({ success: true, message: 'Đã lưu' });
});

server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});