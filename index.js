const express = require('express');
const http = require('http'); 
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
// Tạo server HTTP bọc ngoài Express để chia sẻ cổng với WebSocket
const server = http.createServer(app); 
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= BỘ NHỚ TẠM =================
const locations = {}; // Lưu vị trí: { "ESP32_FIRE_001": "Tầng 1" }
const clients = {};   // Lưu "đường ống" kết nối: { "ESP32_FIRE_001": socket_object }

// ================= WEBSOCKET SERVER =================
// Lắng nghe khi có một thiết bị (ESP32 hoặc Website) cắm ống kết nối vào
wss.on('connection', (ws) => {
    console.log('🔌 Có một thiết bị mới kết nối WebSocket!');

    // Lắng nghe tin nhắn từ thiết bị đó gửi lên
    ws.on('message', (message) => {
        const msg = message.toString();
        
        // Xử lý khi ESP32 báo danh (vd: "REGISTER:ESP32_FIRE_001")
        if (msg.startsWith('REGISTER:')) {
            const deviceID = msg.split(':')[1];
            clients[deviceID] = ws; // Lưu lại ống kết nối của ESP32 này
            console.log(`✅ Đã ghi nhận thiết bị online: ${deviceID}`);

            // Nếu server có lưu vị trí mới trước đó (lúc ESP32 mất mạng), gửi xuống bù lại luôn
            if (locations[deviceID]) {
                ws.send(locations[deviceID]);
            }
        }
    });

    ws.on('close', () => {
        console.log('❌ Một thiết bị đã ngắt kết nối.');
    });
});

// ================= API CHO WEBSITE =================
// API kiểm tra server
app.get('/', (req, res) => {
    res.send('🔥 Fire TTS Server (WebSocket) đang chạy tốt!');
});

// Khi bạn bấm nút trên web, Web sẽ gọi API này để báo cho Server
app.post('/updateLocation', (req, res) => {
    const { deviceID, location } = req.body;

    if (!deviceID || !location) {
        return res.status(400).json({ error: 'Thiếu deviceID hoặc location' });
    }

    // 1. Cập nhật vào bộ nhớ server
    locations[deviceID] = location;
    console.log(`\n📍 Cập nhật vị trí cho [${deviceID}]: ${location}`);

    // 2. Bắn dữ liệu ngay lập tức xuống ESP32 qua ống WebSocket
    if (clients[deviceID] && clients[deviceID].readyState === WebSocket.OPEN) {
        clients[deviceID].send(location);
        console.log('Đã đẩy vị trí mới xuống ESP32 thành công! 🚀');
    } else {
        console.log('⚠️ ESP32 đang offline, sẽ cập nhật khi nó online lại.');
    }

    res.json({ success: true, message: 'Đã lưu và gửi vị trí thành công' });
});

// ================= KHỞI ĐỘNG SERVER =================
server.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});