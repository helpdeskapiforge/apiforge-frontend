
# APIForge - Frontend ⚡️

**APIForge** is a developer-first platform designed to decouple frontend development from backend dependencies. It allows frontend teams to create instant **Mock APIs**, simulate network conditions (latency, errors), and test endpoints using a robust, built-in HTTP client.

Stop waiting for the backend. Forge your own APIs instantly.

---

## 🚀 Key Features

* **⚡️ Instant Mock Servers:** Create RESTful endpoints in seconds by simply pasting JSON.
* **🐢 Latency Simulation:** Artificially inject network delays (e.g., 2000ms) to test loading states and skeletons.
* **💥 Chaos Engineering:** Randomly fail requests (e.g., 10% chance of 500 Error) to test error boundaries and resilience.
* **📮 Request Hub:** A full-featured HTTP client (like Postman) to test your mocks and real APIs.
* **↔️ Resizable, Persisted Layout:** Drag to resize the sidebar and the request/response split — like a real IDE, not a fixed 60/40 layout. Your layout is remembered between sessions, and the response console can be collapsed/expanded with one click.
* **🗂️ Multi-Tab Workspace:** Open several requests, mocks, and environments at once in a browser-style tab strip — closable, pinnable, and restored on refresh.
* **🌍 Environment Variables:** Switch between Local, Dev, and Prod contexts using dynamic variables like `{{baseUrl}}`.
* **📊 Real-time Analytics:** Track request history, status codes, and response times in a unified dashboard.
* **🛡️ Secure Authentication:** JWT-based auth with Next.js Middleware protection and cold-start handling.
* **🤖 AI Tools:** cURL Generator, Postman Test Generator, Mock Data Generator, and JSON Validator, backed by a pluggable AI provider (local Ollama/LM Studio, or free-tier OpenRouter/Gemini) on the backend.

---

## 🛠️ Tech Stack

This project is built with a modern, performance-focused stack:

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **UI Components:** [Shadcn/UI](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **State Management:** React Context API
* **Authentication:** JWT (stored in Cookies via `cookies-next` for Middleware & LocalStorage for Client)
* **Deployment:** [Vercel](https://vercel.com/)

---

## 📸 Screenshots

| **Dashboard** | **Request Hub** |
| --- | --- |
|  |  |
| *Real-time stats & activity feed* | *Test APIs with a clean, powerful client* |

| **Mock Server Config** | **Environment Variables** |
| --- | --- |
|  |  |
| *Simulate latency & errors per route* | *Manage global variables easily* |

---

## 🏗️ Getting Started

### Prerequisites

* The **APIForge Backend** running (see that repo's README) — by default expected at
  `http://localhost:8080`, which its own `docker compose up` already publishes.

### Option A — Docker

```bash
cp .env.example .env.local   # defaults already point at http://localhost:8080
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

### Option B — Node directly

* Node.js 18+ installed

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`NEXT_PUBLIC_API_BASE_URL` in `.env.example`/`.env.local` controls which backend the
app talks to — see that file's comments if the backend isn't on the default port/host.

---

## 📂 Project Structure

A quick look at the top-level files and directories:

```
.
├── app/                  # Next.js App Router pages (Login, Dashboard, etc.)
├── components/           # Reusable UI components
│   ├── explorer/         # Left sidebar lists (RequestExplorer, MockExplorer)
│   ├── request/          # Request Editor components
│   ├── mock/             # Mock Server Editor components
│   └── ui/               # Shadcn UI primitives (Buttons, Inputs, etc.)
├── context/              # Global State (DashboardContext)
├── lib/                  # Utilities (API client, helpers)
├── middleware.ts         # Route protection logic
└── public/               # Static assets

```

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for new features or bug fixes:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.


---

By [Sumit Shresht](https://github.com/sumitshresht)
