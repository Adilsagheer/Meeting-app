# Meeting App

A Google Meet–like video conferencing web application built with Next.js (App Router), JavaScript, Tailwind CSS, shadcn/ui, Firebase Authentication, MongoDB, Socket.IO, and WebRTC.

## Features
- User authentication (Firebase)
- Persistent login (localStorage)
- Dashboard for meetings
- Real-time chat (Socket.IO)
- Video/audio calls (WebRTC)
- Screen sharing
- Unique meeting links
- Protected routes

## Stack
- Next.js (App Router, JavaScript)
- Tailwind CSS & shadcn/ui
- Firebase Auth
- MongoDB (Mongoose)
- Socket.IO
- WebRTC

## Setup
1. Copy `.env.local` from the project description and fill in your credentials.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the development server.

## Folder Structure
- `components/` – Reusable UI components
- `app/` – App Router pages and layouts
- `lib/` – Library code (e.g., Firebase, Mongoose)
- `utils/` – Utility functions

---

This project is modular, scalable, and user-friendly across all devices.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
