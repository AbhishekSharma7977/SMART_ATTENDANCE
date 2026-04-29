# 📱 SafeRoute — Frontend (Client-Side)

Welcome to the frontend core of **SafeRoute**. This application is built using **React 19** and **Vite**, designed for maximum performance, ultra-smooth animations, and a premium user experience.

## ⚡ Tech Stack Details

- **Framework:** React 19 (Latest)
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS 4 (Next-gen utility-first CSS)
- **State Management:** Zustand (Lightweight & Reactive)
- **Animations:** Framer Motion (Fluid transitions and micro-interactions)
- **Icons:** Lucide React
- **Face Recognition:** Face-api.js & TensorFlow.js
- **Charts:** Recharts

---

## 📂 Folder Structure

- `src/components/`: Modular UI components (Layout, Sidebar, Dashboard cards).
- `src/stores/`: Zustand store definitions for Auth and State.
- `src/lib/`: API clients (Axios) and utility helper functions.
- `src/pages/`: Page-level components for routing.
- `public/`: Contains the pre-trained weights for the AI Face Models.

---

## 🤖 AI Face Recognition
The frontend handles client-side face detection and recognition. 
1. **Model Loading:** Models are loaded from the `/public/models` directory.
2. **Real-time Detection:** Uses the device camera to detect landmarks and match descriptors.
3. **Low Latency:** Optimized for high FPS even on mobile devices using WebGL backend.

---

## 🛠️ Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```

3. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🎨 Design System
SafeRoute uses a custom design system built on **Tailwind CSS 4**, featuring:
- **Glassmorphism:** Frosted glass effects for overlays and cards.
- **Dynamic Color Palettes:** Sophisticated dark mode with neon accents.
- **Responsive Layouts:** Mobile-first approach for accessibility on the go.
