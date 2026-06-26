<p align="center">
  <img src="public/logo.jpg" alt="Dragonfly Logo" width="250" height="250" />
</p>

<h1 align="center">Dragonfly</h1>
<p align="center">
  <em>An AI-powered, mobile-first sourcing assistant designed to turn messy hardware ideas into ready-to-buy reality.</em>
</p>

<p align="center">
  <a href="https://dragonfly-rose.vercel.app/"><strong>🌐 Live Web App</strong></a> · 
  <a href="https://youtube.com/shorts/fWHbiZsJTfg?si=6s3VNDjkSPQoyFTz"><strong>🎥 View Demo (Short)</strong></a>
</p>

---

## 🛑 The Problem
The hardware maker's journey frequently breaks down at the sourcing stage. Builders attempting to translate a discovered project or raw idea into a purchasable Bill of Materials (BOM) face a manual, error-prone task. They must identify components, verify stock, ensure correct packaging (e.g., through-hole vs. SMD), cross-reference datasheets for electrical compatibility, and source alternatives for out-of-stock items. This tedious canvassing leads directly to demoralization and abandoned projects.

## 💡 The Solution
Dragonfly eliminates manual canvassing by automating component extraction, intelligent substitution, and design validation. Stop canvassing datasheets and start building.

### ✨ Core Features
* **Multimodal "Inspire" Dashboard:** Upload a schematic or type a natural language prompt (e.g., *"5V line-following robot"*) to instantly generate a parts list.
* **Interactive Smart BOM:** A mobile-optimized feed displaying critical "dealbreaker" specs (operating voltage, package type), live pricing, and stock status.
* **Intelligent Substitution Engine:** Automatically flags out-of-stock items and provides a one-tap modal suggesting drop-in replacements with matching electrical specifications and footprints.
* **"Gotcha" Compatibility Guard:** Proactively evaluates the circuit and displays warnings for common oversights (e.g., voltage logic mismatches or missing flyback diodes).
* **Visual Dependency Flow:** A minimalist, interactive React Flow node-tree mapping out signal and power paths between components.
* **Sticky One-Click Checkout:** Integrates directly with distributor APIs to push the validated BOM directly into a merchant cart.

---

## 🛠️ Tech Stack & Architecture
Although Dragonfly is designed conceptually as a native mobile application, this high-fidelity prototype was built as a **Next.js web application** constrained to a mobile viewport for rapid hackathon iteration. 
* **Frontend Framework:** Next.js (App Router), React, TypeScript
* **Styling:** Tailwind CSS
* **Visual Flow:** React Flow
* **Architecture:** Strict Feature-First / MVC architecture, cleanly decoupling the UI from underlying mock data state logic.

---

## 🚀 Getting Started (Installation)

To run the Dragonfly Next.js prototype locally on your machine, follow these steps:

### 1. Clone the repository
```bash
git clone [https://github.com/your-username/dragonfly.git](https://github.com/your-username/dragonfly.git)
cd dragonfly
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```
### 3. Run the development server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```
### 4. Open the app
Open your browser and navigate to http://localhost:3000.
> [!NOTE]
> For the best experience, open your browser's Developer Tools and toggle the Device Toolbar to view the app in a mobile viewport like an iPhone 14/15.

---

## 👥 The Team

| Name | Role |
| :--- | :--- |
| [**Eger L. Mirasol**](https://github.com/ItIsMeMyselfAndI) | Team Lead & Backend Concepts |
| [**Marcus Mikel S. Abrio**]() | Product Manager |
| [**Kyle Luis E. Marcial**](https://github.com/Kyleeeee0) | Software Architect |
| [**Jana Erin B. Villafranca**]() | UI/UX Designer |
| [**Franchesco Angelo Angeles**]() | Frontend Developer |
| [**Christian Jireh Toreres**]() | AI & Backend Concepts |
