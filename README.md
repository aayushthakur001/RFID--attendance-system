# 📡 RFID Attendance Management System (MERN + IoT)

A full-stack **RFID-based attendance system** using **React, Node.js, Express, MongoDB, JWT, Chart.js, and ESP8266 (NodeMCU) + RC522**.
The system provides **real-time attendance tracking**, **role-based dashboards**, and **CSV export functionality**.

---

## 🧠 Project Overview

This system automates attendance using **RFID + IoT + Web Dashboard**.

When a student scans an RFID card:

1. UID is read using RC522
2. ESP8266 sends data to backend API
3. Backend validates student
4. Attendance stored in MongoDB
5. Dashboard updates in real-time ⚡

---

## ⚙️ Tech Stack

### 💻 Frontend

* React + Vite
* Chart.js
* Context API

### 🛠️ Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT Authentication

### 📡 Hardware

* ESP8266 (NodeMCU)
* RC522 RFID Reader
* Buzzer 🔊
* LED 💡
* LCD (optional)

---

## 📂 Project Structure

```text
rfid-attendance-system/
  backend/
  frontend/
  hardware/
```

---

## 🗄️ Database Collections

* users → name, email, password, role
* students → name, rollNumber, rfid_uid, userId
* attendance → studentId, timestamp, date

---

## 🔐 Authentication

* JWT-based login
* Role-based access:

  * faculty
  * student

---

## 👨‍💼 Faculty Dashboard

* Add students (name, roll, RFID, email, password)
* View student list
* View attendance records
* Filter by date
* Export attendance to CSV
* Charts:

  * Daily attendance
  * Student percentage
  * Monthly trends

---

## 👨‍🎓 Student Dashboard

* View attendance history
* View percentage
* Charts for performance
* Change password

---

## ⚡ Real-Time Flow

RFID Card → ESP8266 → Backend → MongoDB → React Dashboard

* Instant attendance marking
* Live UI updates
* No refresh needed

---

## 📁 CSV Export

* Export attendance data
* Works with Excel / Google Sheets
* Supports filtering

---

## 🔗 API Endpoints

### Auth

* POST `/api/auth/login`

### Students

* POST `/api/students`
* GET `/api/students`

### Attendance

* POST `/api/scan-rfid`
* GET `/api/attendance`
* GET `/api/attendance/student/:id`
* GET `/api/attendance/export`
* GET `/api/attendance/me`
* GET `/api/attendance/analytics`

---

## 🚀 Installation

### 1. Clone project

```bash
git clone <your-repo-url>
cd rfid-attendance-system
```

---

### 2. Backend setup

```bash
cd backend
npm install
copy .env.example .env
```

Update `.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/rfid_attendance
JWT_SECRET=your_secret
RFID_DEVICE_KEY=your_key
CORS_ORIGIN=http://localhost:5173
```

Run:

```bash
npm run dev
```

---

### 3. Frontend setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

---

## 📡 Hardware Setup (ESP8266 + RC522)

| RC522 | ESP8266 |
| ----- | ------- |
| SDA   | D8      |
| SCK   | D5      |
| MOSI  | D7      |
| MISO  | D6      |
| RST   | D3      |
| 3.3V  | 3.3V    |
| GND   | GND     |

---

## 🔌 Additional Components

### 🔊 Buzzer

* Connected to D4
* Beep on success/error

### 💡 LED

* Connected to D2
* Green → Success
* Red → Error

### 📺 LCD (Optional)

| LCD | ESP8266 |
| --- | ------- |
| SDA | D2      |
| SCL | D1      |

---

## 🔌 ESP8266 Setup

* Install Arduino IDE
* Install libraries:

  * MFRC522
  * ESP8266WiFi
  * ESP8266HTTPClient
  * LiquidCrystal_I2C

Set:

* WiFi credentials
* Backend API URL
* Device key

Upload code

---

## 🧪 Running Locally

1. Start MongoDB
2. Run backend
3. Run frontend
4. Login as faculty
5. Add students
6. Scan RFID cards

---

## 🔐 Security

* JWT authentication
* Password hashing (bcrypt)
* Protected routes
* Environment variables

---

## 🚀 Future Improvements

* Forgot password (OTP/email)
* WebSocket real-time updates
* Mobile app
* Multi-institute SaaS

---

## 🧑‍💻 Author

**Ayush Thakur**
https://github.com/aayushthakur001/
**Gaurav Parmar**
https://github.com/parmar-gauravrobot
---

## ⭐ Support

* ⭐ Star the repo
* 🍴 Fork it
* 🚀 Contribute

---

## 📜 License

Educational use only
