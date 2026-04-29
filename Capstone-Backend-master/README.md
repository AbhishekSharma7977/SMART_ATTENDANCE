# ⚙️ SafeRoute — Backend (Server-Side API)

The engine behind the **SafeRoute** ecosystem. This is a high-security, scalable REST API built with **Node.js** and **Express 5**, managing student data, real-time safety tracking, and automated attendance logic.

## 🛡️ Security Architecture

SafeRoute Backend is hardened with multiple layers of security:
- **Authentication:** JWT (JSON Web Tokens) with Secure Cookie storage.
- **Data Sanitization:** Against NoSQL Injection and XSS attacks.
- **Security Headers:** Powered by `Helmet`.
- **DDoS Protection:** IP-based rate limiting on sensitive endpoints.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js (v18+)
- **Web Framework:** Express 5
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Real-time:** Socket.io for live updates
- **Encryption:** Bcrypt for password hashing

---

## 📂 Project Structure

- `controllers/`: Handles incoming requests and orchestrates business logic.
- `models/`: Data schemas defining the structure of Students, Attendance, and Users.
- `routes/`: Endpoint definitions (Auth, Students, Admin, etc.).
- `middlewares/`: Security checks, authentication verification, and error handling.
- `config/`: Database connection and environment configurations.
- `utils/`: Helper functions for response formatting and encryption.

---

## 📡 API Endpoints (Core)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Secure user authentication |
| `GET` | `/api/students` | Retrieve student registry |
| `POST` | `/api/attendance` | Record attendance (Face/QR) |
| `GET` | `/api/alerts` | Real-time safety alerts |

---

## 🚀 Deployment & Configuration

1. **Environment Variables:**
   Create a `.env` file based on `.env.example`:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_ultra_secure_secret
   NODE_ENV=development
   ```

2. **Run Server:**
   ```bash
   npm install
   npm start
   ```

3. **Development Mode (with Hot Reload):**
   ```bash
   npm run dev
   ```

---

## 📈 Scalability
Designed as a stateless API, it can be easily horizontally scaled using PM2 or Docker clusters.
