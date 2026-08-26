# Vector Master Creative ERP System

A React-based ERP application that replicates the exact UI from `basic.html` with Supabase backend integration.

## Features

- **Dashboard**: Overview with real-time statistics and quick actions
- **Prototype Requests**: Track and manage prototype development requests
- **Idea Hub**: Capture and manage innovative ideas from staff
- **Design & BOM**: Manage design workflows and bill of materials
- **Staff Leaves**: Handle leave requests and attendance exceptions

## Setup Instructions

### 1. Install Dependencies

```bash
cd creative
npm install
```

### 2. Configure Supabase

Create a `.env` file in the `creative` directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your Supabase project dashboard:
- Go to https://supabase.com/dashboard
- Select your project
- Navigate to Settings → API
- Copy the Project URL and anon/public key

### 3. Set Up Database Schema

Run the SQL schema file in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `database-schema.sql`
5. Click "Run" to execute the schema

This will create:
- Required ENUM types
- Four main tables: `prototype_requests`, `idea_hub`, `design_bom`, `staff_leaves`
- Row Level Security policies
- Automatic timestamp triggers
- Sample data for testing

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Component Structure

```
src/
├── components/
│   ├── Sidebar.jsx          # Navigation sidebar
│   ├── Header.jsx           # Top header with search and clock
│   ├── DashboardTab.jsx     # Main dashboard with statistics
│   ├── PrototypeTab.jsx     # Prototype requests management
│   ├── IdeaTab.jsx          # Idea hub management
│   ├── DesignTab.jsx        # Design & BOM management
│   └── LeaveTab.jsx         # Staff leave management
├── lib/
│   └── supabaseClient.js    # Supabase client configuration
├── App.jsx                  # Main application component
├── main.jsx                 # React entry point
└── index.css                # Global styles with Tailwind
```

## Database Schema

### Tables

1. **prototype_requests**: Tracks prototype development requests
   - Request details, priority, deadlines, assignments
   - Status tracking (On Progress, Completed, Pending, Rejected)

2. **idea_hub**: Manages innovative ideas
   - Idea details, source, cost estimates
   - Priority and target dates
   - Approval workflow

3. **design_bom**: Design workflow and bill of materials
   - Project details, machine routes
   - Material items and costs
   - Design status tracking

4. **staff_leaves**: Leave request management
   - Employee leave applications
   - Leave types and justifications
   - Approval workflow

## UI Features

- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Clock**: Live clock display in header
- **Search Functionality**: Search within each tab
- **Modal Forms**: Clean modal forms for data entry
- **Status Indicators**: Color-coded status badges
- **Statistics Dashboard**: Live count updates
- **Clock In/Out**: Attendance tracking feature

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Font Awesome**: Icon library
- **Inter Font**: Clean, modern typography
- **Custom Color Scheme**: Slate-based professional palette

## Development

The application uses:
- React 19.1.1
- Vite 7.1.7
- Supabase JS Client 2.110.7
- Tailwind CSS 3.4.19

## Future Enhancements

- User authentication integration
- File upload for specifications
- Email notifications
- Advanced reporting
- Export functionality
- Mobile app version