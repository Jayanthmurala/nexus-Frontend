# Nexus - Academic Collaboration Platform

A comprehensive Next.js-based platform for academic institutions, facilitating student-faculty collaboration, project management, event coordination, and social networking.

## 🚀 Features

### 🎓 Role-Based Access Control
- **Students**: Project applications, badge earning, event participation, social networking
- **Faculty**: Project creation, student mentoring, badge awarding, publication management
- **Department Admins**: Project moderation, student management, departmental analytics
- **Head Admins**: Institution-wide oversight, user management, system administration
- **Placements Admins**: Student data filtering and export for recruitment

### 📚 Project Management
- **Project Marketplace**: Browse and apply to faculty-led research projects
- **Collaboration Hub**: Real-time team workspace with tasks, files, and discussions
- **Application Tracking**: Monitor application status with real-time notifications
- **File Sharing**: Upload and share project files with progress tracking
- **WebSocket Integration**: Live updates for project changes and team activities

### 🏆 Gamification & Badges
- **Badge System**: Earn recognition for achievements and contributions
- **Rarity Levels**: Common, Rare, Epic, and Legendary badges with unique styling
- **Event Creation Gate**: Students must unlock 8 default badges to create events
- **College Member ID**: Primary identifier for reliable student tracking
- **CSV Export**: Comprehensive badge reporting for administrators

### 📅 Event Management
- **Event Calendar**: Interactive calendar with registration management
- **Event Types**: Hackathons, workshops, seminars, conferences, competitions
- **Moderation System**: Admin approval workflow for student-created events
- **Registration System**: Capacity management with real-time updates
- **Multi-Modal Events**: Support for onsite, online, and hybrid events

### 🌐 Social Networking
- **Social Feed**: College and global feeds with post creation and interaction
- **Follow System**: Build academic networks and follow peers/faculty
- **Real-time Messaging**: Private messaging with typing indicators
- **Post Visibility**: Public or college-only post visibility controls
- **Media Sharing**: Upload and share images and documents in posts

### 👤 Profile Management
- **Role-Based Profiles**: Customized profile sections for different user types
- **Student Profiles**: Projects showcase, skills, badges, academic information
- **Faculty Profiles**: Publications, expertise, research interests, bio
- **Social Integration**: LinkedIn, GitHub, Google Scholar, ORCID links
- **Profile Strength**: Dynamic indicators for profile completeness

### 🔐 Authentication & Security
- **NextAuth Integration**: Secure session management with JWT tokens
- **OAuth Support**: Google and GitHub authentication
- **Role Guards**: Component-level access control
- **Token Refresh**: Automatic token refresh with HttpOnly cookies
- **Email Verification**: Account verification and password reset flows

## 🏗️ Architecture

### Frontend (Next.js 14)
- **Framework**: Next.js with App Router and TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Redux Toolkit with RTK Query
- **Authentication**: NextAuth.js with custom providers
- **Real-time**: Socket.IO client for WebSocket connections
- **Animations**: Framer Motion for smooth transitions

### Backend Services (Microservices)
- **Auth Service** (Port 4001): User authentication, authorization, JWT management
- **Profile Service** (Port 4002): User profiles, badges, publications, personal projects
- **Projects Service** (Port 4003): Project management, applications, collaboration
- **Events Service** (Port 4004): Event creation, registration, moderation
- **Network Service** (Port 4005): Social features, messaging, feeds

### Key Technologies
- **Database**: PostgreSQL with Prisma ORM
- **File Storage**: Cloudinary for media uploads
- **Real-time**: Socket.IO for WebSocket connections
- **Email**: Nodemailer with MJML templates
- **Validation**: Zod schemas across frontend and backend
- **API**: RESTful APIs with comprehensive error handling

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ and npm/pnpm
- PostgreSQL database
- Cloudinary account (for file uploads)
- SMTP server (for emails)

### Environment Variables
Create `.env.local` in the nexus directory:

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-strong-random-secret

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret

# Service Base URLs
NEXT_PUBLIC_API_BASE_URL=http://localhost:4001          # auth-service
NEXT_PUBLIC_PROFILE_API_BASE_URL=http://localhost:4002  # profile-service
NEXT_PUBLIC_PROJECTS_API_BASE_URL=http://localhost:4003 # projects-service
NEXT_PUBLIC_EVENTS_API_BASE_URL=http://localhost:4004   # event-service
NEXT_PUBLIC_NETWORK_API_BASE_URL=http://localhost:4005  # network-service
```

### Installation & Setup

1. **Clone and Install Dependencies**
```bash
cd nexus
npm install
```

2. **Start Backend Services**
```bash
cd ../nexusbackend
npm run install:backend
npm run dev:all
```

3. **Start Frontend**
```bash
cd ../nexus
npm run dev
```

4. **Access the Application**
- Frontend: http://localhost:3000
- Backend services: Ports 4001-4005

## 📖 Documentation

### Frontend Integration Guides
- [Authentication Guide](docs/frontend-auth.md) - NextAuth, OAuth, role-based access
- [Profile Guide](docs/frontend-profile.md) - User profiles, badges, publications
- [Projects Guide](docs/frontend-projects.md) - Project management, collaboration
- [Events Guide](docs/frontend-events.md) - Event creation, registration, moderation
- [Network Guide](docs/frontend-network.md) - Social features, messaging, feeds

### Additional Documentation
- [WebSocket Integration](docs/websocket-integration.md) - Real-time features setup
- [Bio Saving Fix](docs/bio-saving-fix.md) - Profile service integration details

## 🎯 Key Features by Role

### Students
- **Project Discovery**: Browse and apply to research projects
- **Collaboration**: Join project teams and contribute to research
- **Skill Building**: Earn badges and showcase achievements
- **Networking**: Connect with peers and faculty members
- **Event Participation**: Register for academic events and workshops
- **Profile Building**: Create comprehensive academic profiles

### Faculty
- **Project Leadership**: Create and manage research projects
- **Student Mentoring**: Review applications and guide student teams
- **Recognition**: Award badges to outstanding students
- **Event Creation**: Organize academic events and workshops
- **Publication Management**: Maintain academic publication records
- **Network Building**: Connect with students and fellow faculty

### Administrators
- **Institution Management**: Oversee platform usage and user management
- **Content Moderation**: Review and approve student-created content
- **Analytics**: Access comprehensive platform analytics and reports
- **Badge Management**: Create and manage institutional badge systems
- **Event Oversight**: Moderate and manage institutional events
- **Data Export**: Generate reports for institutional planning

## 🔧 Technical Highlights

### Performance Optimizations
- **Server-Side Rendering**: Initial page loads with SSR
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js Image component with Cloudinary
- **Caching**: Redis caching for frequently accessed data
- **Lazy Loading**: Component and route-based lazy loading

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permission system
- **CORS Configuration**: Proper cross-origin resource sharing
- **Input Validation**: Comprehensive Zod schema validation
- **XSS Protection**: Built-in Next.js security features

### Real-time Features
- **WebSocket Integration**: Live updates across the platform
- **Typing Indicators**: Real-time messaging feedback
- **Notification System**: Instant notifications for important events
- **Live Collaboration**: Real-time project collaboration features
- **Status Updates**: Live application and project status changes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with Next.js, React, and TypeScript
- UI components from shadcn/ui and Radix UI
- State management with Redux Toolkit
- Authentication powered by NextAuth.js
- Real-time features with Socket.IO
- Database management with Prisma ORM
