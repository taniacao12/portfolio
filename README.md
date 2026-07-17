# portfolio

> A clean personal portfolio website built with Astro.

This project is a personal portfolio website designed to showcase professional work, projects, and skills. Built with Astro, it leverages static site generation to deliver high performance and fast load times with minimal client-side overhead.

The application uses Astro's file-based routing system with pages organized under the src/pages directory, including a primary index.astro landing page.

It is ideal for developers and creators who need a lightweight, easily customizable web presence that can be built and deployed statically to any modern hosting provider.

## ✨ Key Features

- **🚀 Astro File-Based Routing** — Organizes application pages and routes automatically based on files placed in the src/pages directory.
- **📦 Static Asset Management** — Serves static images and media assets directly from the public directory.
- **⚙️ Production Build Pipelines** — Includes predefined scripts to build and preview the optimized static build locally before deployment.

## 🎯 Use Cases

- Deploying a personal developer portfolio to showcase software projects and resumes.
- Creating a lightweight, content-focused landing page using static site generation.

## 🛠️ Tech Stack

**Frontend:**

![Astro](https://img.shields.io/badge/Astro-BC52EE?style=for-the-badge&logo=astro&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=white)

**Tools & Build:**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white) ![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)

**DevOps:**

![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

## ⚡ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/taniacao12/portfolio.git

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev

# 4. Open your browser
# Visit `http://localhost:4321` (or the port specified in your console).
```

## 📦 Key Dependencies

```
astro: ^6.1.3
```

## 🚀 Available Scripts

- **dev** — `npm run dev`
- **build** — `npm run build`
- **preview** — `npm run preview`
- **astro** — `npm run astro`

## 📁 Project Structure

```
.
├── astro.config.mjs
├── package.json
├── public
│   ├── codecheck
│   │   └── Icon.png
│   ├── deathandrevival
│   │   ├── Church 1.jpg
│   │   ├── Church 2.jpg
│   │   ├── Landscape 1.jpg
│   │   └── Landscape 2.jpg
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── rainbowschool
│   │   └── Church 2.jpg
│   └── scripts
│       └── HeroCanvas.js
├── src
│   ├── components
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   └── HeroCanvas.astro
│   ├── layouts
│   │   ├── Base.astro
│   │   ├── Project.astro
│   │   └── Publication.astro
│   ├── pages
│   │   ├── index.astro
│   │   ├── projects
│   │   │   ├── chelseatimberlibrary.astro
│   │   │   ├── deathandrevival.astro
│   │   │   ├── gardencentral.astro
│   │   │   ├── goquest.astro
│   │   │   ├── lensintothefuture.astro
│   │   │   └── rainbowschool.astro
│   │   └── publications
│   │       └── codecheck.astro
│   ├── scripts
│   │   └── GetContent.ts
│   └── styles
│       └── global.css
└── tsconfig.json
```

## 🛠️ Development Setup

### Node.js / JavaScript
1. Install [Node.js](https://nodejs.org/) (v18+ recommended)
2. Install dependencies: `npm install` (or `yarn` / `pnpm install` / `bun install`)
3. Start the dev server: see the **Quick Start** above