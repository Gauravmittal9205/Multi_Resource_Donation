# ⚙️ Multi-Resource Donation Platform — Backend

<div align="center">

<img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=30&pause=1000&color=00F7FF&center=true&vCenter=true&width=1000&lines=🚀+Multi-Resource+Donation+Platform;⚡+Scalable+Real-Time+Backend+System;🔐+JWT+Authentication+%7C+WebSockets;🌍+Helping+Communities+Through+Technology" />

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,100:2563eb&height=220&section=header&text=Backend%20Engine&fontSize=50&fontColor=ffffff&animation=fadeIn&fontAlignY=35"/>

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-18.x+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![JWT](https://img.shields.io/badge/Auth-JWT-orange?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io/)
[![Firebase](https://img.shields.io/badge/Firebase-Admin-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

<br/>

<img src="https://github-profile-trophy.vercel.app/?username=Akshat9205&theme=tokyonight&row=1&column=6&margin-w=15&margin-h=15"/>

</div>

---

# 🌍 About The Project

> A scalable and real-time backend platform designed to connect **donors, NGOs, volunteers, and communities** through technology.

This backend powers a complete donation ecosystem with:

✨ Secure Authentication  
✨ Real-Time Notifications  
✨ NGO Verification System  
✨ Event & Campaign Management  
✨ Geo-location Based Coordination  
✨ Resource Donation Lifecycle  
✨ RESTful APIs with JWT Security  

---

# 🧠 Tech Stack

<div align="center">

| Technology | Purpose |
|------------|---------|
| ⚡ Node.js | Runtime Environment |
| 🚂 Express.js | Backend Framework |
| 🍃 MongoDB | NoSQL Database |
| 🧩 Mongoose | ODM |
| 🔐 JWT | Authentication |
| 📡 Socket.io | Real-Time Updates |
| 🔥 Firebase Admin | Notifications & Security |
| 📧 Nodemailer | Email Services |

</div>

---

# 📁 Folder Structure

```bash
backend/
│
├── 📂 config/
│   ├── Firebase Configurations
│   └── Security Modules
│
├── 📂 controllers/
│   ├── Auth Controllers
│   ├── Donation Controllers
│   ├── NGO Controllers
│   └── Profile Controllers
│
├── 📂 middleware/
│   ├── JWT Authentication
│   ├── Role Authorization
│   └── Request Validators
│
├── 📂 models/
│   ├── User Model
│   ├── Donation Model
│   ├── NGO Model
│   ├── Notification Model
│   └── Event Model
│
├── 📂 routes/
│   └── API Route Definitions
│
├── 📂 scripts/
│   ├── Database Optimization
│   └── Admin Seeder Scripts
│
├── 📂 utils/
│   ├── Nodemailer Setup
│   └── Response Utilities
│
└── 🚀 server.js
```

---

# 🔐 Authentication APIs

```http
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/profile
PUT    /api/v1/profile
```

---

# 🎁 Donation APIs

```http
POST   /api/v1/donations
GET    /api/v1/donations
PUT    /api/v1/donations/:id/status
```

---

# 🏢 NGO & Campaign APIs

```http
POST   /api/v1/ngo-registration
GET    /api/v1/ngo-requests
POST   /api/v1/announcements
POST   /api/v1/event-registrations
```

---

# ⚡ Features

<div align="center">

| Feature | Status |
|---------|--------|
| 🔐 JWT Authentication | ✅ |
| 📡 Real-Time Communication | ✅ |
| 🌍 Geo-location Support | ✅ |
| 📧 Email Notifications | ✅ |
| 🏢 NGO Verification | ✅ |
| 🎁 Donation Tracking | ✅ |
| 🔥 Firebase Integration | ✅ |
| 📊 REST APIs | ✅ |

</div>

---

# 🚀 Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/multi-resource-donation-platform.git
cd multi-resource-donation-platform/backend
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Configure Environment Variables

Create a `.env` file:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/donation_db

JWT_SECRET=your_jwt_secret_token

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com

# Email Config
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

---

# ▶️ Run Server

### 🔥 Development Mode

```bash
npm run dev
```

### 🚀 Production Mode

```bash
npm start
```

---

# 📦 Operational Scripts

## 👨‍💻 Seed Admin

```bash
npm run seed:admin
```

## ⚡ Optimize Database

```bash
npm run optimize:db
```

---

# 📡 System Architecture

```mermaid
graph TD;

A[🌐 Client Application] -->|REST APIs| B[⚡ Express Server]
B --> C[(🍃 MongoDB Database)]
B --> D[📡 Socket.io]
D --> E[🔔 Real-Time Notifications]
B --> F[🔥 Firebase Admin]
B --> G[📧 Nodemailer SMTP]
```

---

# 🔥 Future Enhancements

- 🤖 AI-based resource prioritization
- 📱 Mobile App Integration
- 🌐 Multi-language Support
- 📍 Live NGO Resource Mapping
- 💳 Donation Payment Gateway
- 📈 Analytics Dashboard

---

# 🤝 Contributing

```bash
# Fork Repository

# Create Feature Branch
git checkout -b feature/AmazingFeature

# Commit Changes
git commit -m "Added Amazing Feature"

# Push Branch
git push origin feature/AmazingFeature
```

---

# ⭐ Show Your Support

If you like this project, give it a ⭐ on GitHub and support the mission 🚀

---

<div align="center">

## 💙 Built With Passion To Help Communities

<img src="https://readme-typing-svg.herokuapp.com?font=Poppins&weight=600&size=24&pause=1000&color=00D9FF&center=true&vCenter=true&width=850&lines=Connecting+Donors+With+Communities;Empowering+NGOs+Through+Technology;Real-Time+Resource+Sharing+Platform;Built+Using+Node.js+%2B+MongoDB+%2B+Socket.io" />

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:2563eb,100:0f172a&height=140&section=footer"/>

</div>
