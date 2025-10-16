# Smart Energy Management Platform

## Overview
A full-stack IoT-enabled energy management web application with real-time monitoring, control, billing, and AI-driven insights. The platform supports block-level energy meters (ESP32 devices), allows admin to allocate power quotas, students to monitor usage, and integrates RBAC, payments, and notifications.

## Current Status
**Authentication & RBAC System Complete** ✅
- ✅ Database schema defined for all tables (users, blocks, lines, energy_logs, payments, alerts, ai_predictions)
- ✅ Supabase/Neon PostgreSQL database with Drizzle ORM migrations
- ✅ Row-Level Security (RLS) policies for role-based data access
- ✅ JWT-based authentication with bcrypt password hashing
- ✅ Cookie-based session management (httpOnly, 7-day expiry)
- ✅ Role-based middleware for API route protection
- ✅ Authentication API routes (register, login, logout, session)
- ✅ Authentication UI (login, register) with role-based registration
- ✅ Theme provider with dark/light mode support
- ✅ Protected route system with automatic redirects
- ✅ Admin and student dashboard layouts with Shadcn sidebar navigation
- ✅ Role-based UI components and navigation structure
- ✅ CRUD endpoints for blocks, lines, and users

**Next Steps**: Real-time energy monitoring, payment integration, AI analytics, WhatsApp chatbot

## Tech Stack

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **Styling**: Tailwind CSS + Shadcn/UI components
- **State Management**: TanStack Query (React Query v5)
- **Forms**: React Hook Form + Zod validation
- **Theme**: Dark mode by default with light mode toggle

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: Supabase (PostgreSQL via Drizzle ORM)
- **Authentication**: JWT-based sessions with role-based access control (RBAC)
- **Real-time**: Supabase Realtime (planned)

### Deployment
- **Platform**: Vercel (planned)
- **Database**: Supabase hosted PostgreSQL

## Project Structure

### Key Files
- `shared/schema.ts` - Complete database schema with Drizzle ORM and Zod validation
- `client/src/App.tsx` - Main app with routing and protected routes
- `client/src/components/theme-provider.tsx` - Dark/light mode management
- `client/src/components/auth/` - Authentication forms and route protection
- `client/src/components/dashboard/` - Admin and student sidebar layouts
- `client/src/pages/auth.tsx` - Login/register page with role selection
- `client/src/pages/admin/dashboard.tsx` - Admin overview dashboard
- `client/src/pages/student/dashboard.tsx` - Student energy monitoring dashboard
- `design_guidelines.md` - Comprehensive design system documentation

## User Roles & Permissions

### Admin Role
- Create/manage blocks and lines
- Set monthly energy quotas per line
- Disconnect/reconnect rooms remotely
- View all usage data across blocks
- Manage payments and alerts
- Generate reports and analytics

### Student Role
- View personal energy usage and quota
- Monitor remaining kWh and predicted exhaustion date
- Top-up energy balance via payment gateway
- Receive notifications and alerts
- Chat with AI assistant for energy tips

## Database Schema

### Users Table
- `id` (UUID, primary key)
- `email` (unique, required)
- `passwordHash` (required)
- `role` (enum: 'admin' | 'student')
- `blockId` (foreign key to blocks)
- `lineId` (foreign key to lines)
- `createdAt` (timestamp)

### Blocks Table
- `id` (UUID, primary key)
- `name` (unique, required)
- `totalQuotaKwh` (decimal)
- `createdAt` (timestamp)

### Lines Table
- `id` (UUID, primary key)
- `blockId` (foreign key to blocks)
- `lineNumber` (integer, required)
- `currentQuotaKwh` (decimal)
- `remainingKwh` (decimal)
- `status` (enum: 'active' | 'idle' | 'disconnected')
- `createdAt` (timestamp)

### Energy Logs Table
- `id` (UUID, primary key)
- `lineId` (foreign key to lines)
- `timestamp` (auto)
- `powerW` (decimal, watts)
- `voltageV` (decimal, volts)
- `currentA` (decimal, amperes)
- `energyKwh` (decimal, kilowatt-hours)

### Payments Table
- `id` (UUID, primary key)
- `userId` (foreign key to users)
- `amount` (decimal)
- `unitsAddedKwh` (decimal)
- `status` (enum: 'pending' | 'completed' | 'failed')
- `reference` (unique, required)
- `timestamp` (auto)

### Alerts Table
- `id` (UUID, primary key)
- `lineId` (foreign key to lines)
- `type` (enum: 'low_balance' | 'idle_line' | 'overload' | 'disconnection' | 'top_up_confirmation')
- `message` (text, required)
- `createdAt` (timestamp)

### AI Predictions Table
- `id` (UUID, primary key)
- `lineId` (foreign key to lines)
- `predictedDaysLeft` (integer)
- `recommendedDailyUsageKwh` (decimal)
- `createdAt` (timestamp)

## Environment Variables
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `SESSION_SECRET` - JWT session signing secret
- Future: `PAYSTACK_SECRET_KEY`, `WHATSAPP_API_KEY`, `OPENAI_API_KEY`

## Design System
The application follows an enterprise dashboard design inspired by Linear, Vercel Dashboard, and Material Design. Key principles:
- **Dark mode primary** with vibrant green (142 76% 45%) as brand color
- **Data-dense layouts** with strategic whitespace
- **Status-driven design** with color-coded indicators
- **Role distinction** through subtle UI differences
- **Accessibility-first** with proper contrast ratios and focus states

See `design_guidelines.md` for complete design documentation.

## Development Guidelines
- Uses fullstack JavaScript template with Express + React
- Schema-first development approach
- Protected API routes with role-based middleware
- Client-side route protection with automatic redirects
- Form validation with Zod schemas
- Type-safe data models shared between frontend and backend

## Planned Features (Future Phases)
1. **Real-time Energy Monitoring**: ESP32 device integration via MQTT/HTTP
2. **Payment Integration**: Paystack/Flutterwave for energy top-ups
3. **AI Analytics**: Consumption predictions, anomaly detection, personalized tips
4. **WhatsApp Chatbot**: Balance inquiries, alerts, appliance simulation
5. **Advanced Dashboards**: Charts, reports, historical data visualization
6. **Notification System**: Email, WhatsApp, in-app alerts with scheduling
