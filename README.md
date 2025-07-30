# Jewish Gymnastics League Management System

A comprehensive web application for managing gymnastics league operations, including gym management, event registration, challenge systems, and payment processing.

## 🚀 Features

### **Multi-Role System**
- **League Admins**: Full system oversight and management
- **Gym Administrators**: Manage their gym and coaches
- **Coaches**: Manage gymnasts and approve registrations
- **Gymnasts**: Register for events and participate in challenges
- **Event Hosts**: Create and manage competitions

### **Core Functionality**
- ✅ **Gym Management**: Multi-gym league with approval workflows
- ✅ **Event Management**: Create competitions with registration and ticketing
- ✅ **Registration System**: Coach approval workflow for event participation
- ✅ **Challenge System**: Gamified challenges with points and leaderboards
- ✅ **Payment Processing**: Stripe integration for fees and tickets
- ✅ **Real-time Updates**: Live notifications and status updates
- ✅ **Mobile Responsive**: Works perfectly on all devices

### **Advanced Features**
- 📧 **Email Notifications**: Automated reminders and confirmations
- 📊 **Analytics Dashboard**: Performance metrics and reporting
- 🔒 **Role-based Security**: Comprehensive permission system
- 💳 **Payment Tracking**: Full transaction history and status
- 🏆 **Leaderboards**: Gymnast rankings and achievements
- 📱 **Real-time Sync**: Live updates across all users

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Payments**: Stripe
- **Deployment**: Netlify
- **Icons**: Lucide React

## 📋 Prerequisites

Before setting up the project, you'll need:

1. **Supabase Account** (Free tier available)
   - Create account at [supabase.com](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key

2. **Stripe Account** (Pay-per-transaction)
   - Create account at [stripe.com](https://stripe.com)
   - Get your API keys from the dashboard

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd jgl-management-system
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_DB_URL=postgresql://username:password@db.supabase.co:5432/postgres
```

### 3. Database Setup

1. **Connect to Supabase** by setting `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_DB_URL` in your `.env` file. The `SUPABASE_DB_URL` value should be the service role connection string from the Supabase dashboard.
2. **Reset & Run Migrations** using the provided script:
   ```bash
   npm run reset-supabase
   ```
   This command drops the existing `public` schema and re-applies all SQL files in `supabase/migrations`.
3. **Seed Demo Data** *(optional)*: Populate initial gyms, events, and challenges after the migrations are applied.

### 4. Start Development
```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

### Debugging Supabase Connection

When running the app in development mode, the browser console logs whether your
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` variables were detected. If
they are missing, the application will not load data from Supabase.

Additional `[auth]` and `[supabase]` messages now show the steps taken when the
application checks the current session and loads the user profile. Watch the
console to confirm that your credentials load correctly and the Supabase client
initializes without errors.

Every request to Supabase is logged in development mode, showing the HTTP
method, URL, response status, and how long the request took. Errors are printed
to the console to help diagnose network or permission issues.

## 🗄️ Database Schema

The system uses a comprehensive PostgreSQL schema with:

### **Core Tables**
- `gyms` - Gymnastics facilities
- `user_profiles` - User information and roles
- `gymnasts` - Gymnast-specific data and team membership
- `events` - Competitions and league events
- `registrations` - Event registrations with approval workflow

### **Engagement & Payments**
- `challenges` - Gamification challenges
- `challenge_completions` - Progress tracking
- `payments` - Transaction history
- `notifications` - System communications

### **Security Features**
- Row Level Security (RLS) on all tables
- Role-based access policies
- Secure authentication flow
- Data isolation by gym/role

## 👥 User Roles & Permissions

### **League Admin**
- Manage all gyms and approve new facilities
- Create league-wide events and challenges
- View all analytics and export data
- Send system-wide communications

### **Gym Admin**
- Manage their gym's information
- Oversee coaches and gymnasts
- Create gym-specific events
- View gym performance metrics

### **Coach**
- Manage their gymnasts
- Approve/reject event registrations
- Create challenges for their team
- Track team performance

### **Gymnast**
- Register for events (pending coach approval)
- Participate in challenges
- View personal progress and rankings
- Receive notifications and updates

## 💳 Payment Integration

The system integrates with Stripe for secure payment processing:

- **Event Registration Fees**: Automated collection upon approval
- **Spectator Tickets**: Public ticket sales for events
- **Membership Fees**: Recurring gym membership billing
- **Refund Management**: Automated refund processing

## 📧 Communication System

Built-in notification system with:

- **Real-time Notifications**: Instant updates in the app
- **Email Integration**: Automated email notifications
- **Custom Messaging**: Targeted communications by role/gym
- **Event Reminders**: Automated deadline and event reminders

## 🚀 Deployment

### **Frontend Deployment (Netlify)**
```bash
npm run build
# Deploy to Netlify (automatic via GitHub integration)
```

### **Database (Supabase)**
- Migrations run automatically
- Real-time subscriptions enabled
- Row Level Security configured

### **Environment Variables**
Production environment needs:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Stripe keys (configured in Supabase Edge Functions)

## 📊 Analytics & Reporting

The system provides comprehensive analytics:

- **Registration Metrics**: Event participation rates
- **Gym Performance**: Individual gym statistics
- **Challenge Engagement**: Completion rates and leaderboards
- **Payment Analytics**: Revenue tracking and trends
- **User Activity**: Login and engagement metrics

## 🔧 Development

### **Project Structure**
```
src/
├── components/          # React components
│   ├── Auth/           # Authentication components
│   ├── Dashboard/      # Role-specific dashboards
│   ├── Events/         # Event management
│   ├── Challenges/     # Challenge system
│   └── Layout/         # Layout components
├── contexts/           # React contexts
├── lib/               # Utilities and API clients
├── types/             # TypeScript type definitions
└── styles/            # CSS and styling

supabase/
├── migrations/        # Database migrations
└── functions/         # Edge functions (for payments)
```

### **Key Commands**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the database schema
- Contact the development team

---

**Built with ❤️ for the Jewish Gymnastics League community**