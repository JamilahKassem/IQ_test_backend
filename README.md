# IQ Test Platform (Real-Time)

A high-concurrency, real-time IQ assessment platform built with **Next.js**, **WebSockets**, and **Prisma**. This application enables an administrator to orchestrate a synchronized testing experience for multiple participants simultaneously.

## 🚀 Core Features

*   **Real-Time Synchronization:** Uses WebSockets to broadcast phase changes (Waiting, Testing, Results) to all connected clients instantly.
*   **Dual-User Workflows:** 
    *   **Admin:** Controls the flow of the exam, triggers the next question, and monitors final results.
    *   **Competent (User):** Participates in the exam, receives live updates, and submits answers within time constraints.
*   **Automated Transitions:** Each question includes a specific timer. Once the time elapses, the platform automatically reverts to the "Waiting" phase.
*   **Robust Data Management:** Leverages Prisma with SQLite for efficient storage of question sets and user response tracking.

## 🛠 Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router/Pages Router)
*   **Database:** [Prisma](https://www.prisma.io/) with **SQLite**
*   **Real-Time:** [WebSockets (WS/Socket.io)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)

---

## 🔄 The Examination Lifecycle

The exam moves through three distinct phases controlled via WebSocket broadcasts:

| Phase | Description |
| :--- | :--- |
| **1. Waiting** | The "Get Ready" screen. Users wait for the Admin to initiate the next challenge. |
| **2. Taking Question** | The active phase. Users view the image-based question and select multiple-choice answers (A, B, C...). |
| **3. Exam End** | Final state where data is consolidated and results are made available to the Administrator. |

---

## 🏗 Database Schema (Simplified)

The project uses a relational structure to link questions with user results:

*   **Question:** Stores the image path, duration, and metadata.
*   **Result:** Tracks which user answered which question, their selected option, and timestamps.
*   **User:** Answers the questions and takes exam (Competent).
*   **Admin:** Manages authentication and roles (Competent).

---

## 🏁 Getting Started

### Prerequisites
*   Node.js 18+ 
*   npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YourUsername/IQ_test_next.git
   cd IQ_test_next
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

---

## 📡 WebSocket Logic
The communication layer handles two primary events:
*   **`NextQuestion`**: Sent by the Admin to trigger the transition from "Waiting" to "Question" for all users.
*   **`EndQuestion`**: Sent by the Server when question timer runs out.
*   **`Endexam`**: Sent by the admin when final question is reached.

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
```
