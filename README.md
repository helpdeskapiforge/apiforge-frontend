
# APIForge - Frontend ⚡️

**APIForge** is a developer-first platform designed to decouple frontend development from backend dependencies. It allows frontend teams to create instant **Mock APIs**, simulate network conditions (latency, errors), and test endpoints using a robust, built-in HTTP client.

Stop waiting for the backend. Forge your own APIs instantly.

---

## 🚀 Key Features

* **⚡️ Instant Mock Servers:** Create RESTful endpoints in seconds by simply pasting JSON.
* **🐢 Latency Simulation:** Artificially inject network delays (e.g., 2000ms) to test loading states and skeletons.
* **💥 Chaos Engineering:** Randomly fail requests (e.g., 10% chance of 500 Error) to test error boundaries and resilience.
* **📮 Request Hub:** A full-featured HTTP client (like Postman) to test your mocks and real APIs.
* **🌍 Environment Variables:** Switch between Local, Dev, and Prod contexts using dynamic variables like `{{baseUrl}}`.
* **📊 Real-time Analytics:** Track request history, status codes, and response times in a unified dashboard.
* **🛡️ Secure Authentication:** JWT-based auth with Next.js Middleware protection and cold-start handling.

---

## 🛠️ Tech Stack

This project is built with a modern, performance-focused stack:

* **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
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

Follow these steps to run the frontend locally.

### Prerequisites

* Node.js 18+ installed
* The **APIForge Backend** running locally on port `8080` (or update the API URL in the code).

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/apiforge-frontend.git
cd apiforge-frontend

```


2. **Install dependencies:**
```bash
npm install
# or
yarn install
# or
pnpm install

```


3. **Run the development server:**
```bash
npm run dev

```


4. **Open in Browser:**
Navigate to [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000).

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
