# PharmaPOS — Pharmacy Management System

A complete Pharmacy Point of Sale system built with **Next.js 16**, **TypeScript**, and **Tailwind CSS**.

## Features

- **Dashboard** — Daily stats, low stock alerts, expiry alerts, recent sales
- **Point of Sale** — Medicine search, cart management, customer selection, multiple payment methods
- **Inventory** — Real-time stock tracking, low stock & expiry filters
- **Medicines** — Full CRUD with categories, batch numbers, prescription flags
- **Customers** — Customer management with purchase history
- **Suppliers** — Supplier contact management
- **Reports** — Revenue analytics, top selling medicines, payment method breakdown
- **Settings** — Pharmacy info, tax rate, currency configuration

## Tech Stack

| Package | Purpose |
|---|---|
| Next.js 16 (App Router) | Framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| Zustand | State management |
| Lucide React | Icons |
| Recharts | Charts |
| React Hot Toast | Notifications |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # All main pages (layout with sidebar)
│   │   ├── page.tsx          # Dashboard
│   │   ├── sales/            # Point of Sale
│   │   ├── inventory/        # Inventory management
│   │   ├── medicines/        # Medicine catalog
│   │   ├── customers/        # Customer management
│   │   ├── suppliers/        # Supplier management
│   │   ├── reports/          # Reports & analytics
│   │   └── settings/         # App settings
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                   # Button, Input, Card, Modal, Badge, Table, StatCard
│   └── layout/               # Sidebar, Header
├── lib/
│   ├── utils.ts              # Helper functions
│   ├── constants.ts          # App constants
│   └── mockData.ts           # Sample data
├── store/
│   └── index.ts              # Zustand store
└── types/
    └── index.ts              # TypeScript interfaces
```

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
