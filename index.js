const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Lưu vị trí theo từng ESP32
const locations = {};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====================== API ======================

// Kiểm tra server có chạy không
app.get('/', (req, res) => {
  res.send('🔥 Fire TTS Server đang chạy tốt!');
});

// Website gửi vị trí mới xuống
app.post('/updateLocation', (req, res) => {
  const { deviceID, location } = req.body;

  if (!deviceID || !location) {
    return res.status(400).json({ error: "Thiếu deviceID hoặc location" });
  }

  locations[deviceID] = location;
  console.log(`📍 Cập nhật: ${deviceID} → ${location}`);

  res.json({ success: true, message: "Đã cập nhật vị trí thành công" });
});

// ESP32 lấy vị trí
app.get('/getLocation', (req, res) => {
  const { deviceID } = req.query;

  if (!deviceID) {
    return res.status(400).json({ error: "Thiếu deviceID" });
  }

  const location = locations[deviceID] || "Khu vực mặc định";
  res.send(location);
});

// ====================== CHẠY SERVER ======================
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});