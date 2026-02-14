# Good Driver Incentive Program (DriveWell)

An iterative web application designed for the trucking industry to incentivize safe driving behavior through a points-based rewards system.

## 🚀 Features

- **Multi-Role Dashboards**: Specific interfaces for Drivers, Sponsors (Fleet Managers), and System Admins.
- **Points Management**: Sponsors can award or deduct points based on safety performance with "Points Floor" protection.
- **Rewards Catalog**: Drivers can redeem points for products, featuring a real-time cart and USD conversion estimates.
- **Fleet Management**: Historical tracking of drivers with the ability to "Drop" or "Re-activate" members while retaining audit trails.
- **Communications**: Real-time chat system between drivers and sponsors with integrated refund approval workflows.
- **Analytics**: Business Intelligence tab with Recharts for visualizing point distribution and fleet growth.

## 🛠 Tech Stack

- **Frontend**: React (v19), TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Backend/Auth**: Firebase (Auth & Analytics)
- **Database**: Simulated AWS RDS (MySQL) with a logic facade for seamless switching between Mock and Live modes.

## 📦 Getting Started

1. **Environment**: Ensure you have your Firebase configuration updated in `services/firebase.ts`.
2. **Local Development**:
   - The app defaults to **Test Mode** (Mock Services) for easy previewing.
   - Use the "Settings" gear in the Navbar to toggle between Mock and Live API modes.
3. **Deployment**:
   - This project is optimized for deployment to platforms like Vercel, Netlify, or GitHub Pages.
   - Ensure the `API_KEY` is set in your deployment environment variables if moving to production.

## 🛡 Security & Auditing

The system maintains a rigorous Audit Log for all critical actions:
- Password overrides
- Point changes
- User status updates (Bans/Drops)
- System setting modifications

---
*Developed by Team 2 - Sprint 3*