# Computer Science Assessment System

A modern web application for conducting computer science assessments, built with React, Express, and MongoDB.

## Features

- User authentication and authorization
- Multiple choice and coding questions
- Real-time assessment tracking
- Automatic grading
- Student progress monitoring
- Beautiful UI with Tailwind CSS and Radix UI

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB
- **Authentication**: Passport.js
- **Build Tools**: Vite, ESBuild
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18 or later
- MongoDB database
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd computer-science-assessment
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   MONGO_DB=your_mongodb_uri
   SESSION_SECRET=your_session_secret
   NODE_ENV=development
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
npm run build
```

### Running in Production

```bash
npm start
```

## Project Structure

```
├── client/             # Frontend React application
├── server/            # Backend Express application
├── shared/            # Shared types and utilities
├── api/              # Vercel serverless functions
├── public/           # Static assets
└── dist/             # Build output
```

## Environment Variables

- `MONGO_DB`: MongoDB connection URI
- `SESSION_SECRET`: Secret for session management
- `NODE_ENV`: Environment (development/production)

## Deployment

The application is configured for deployment on Vercel:

1. Push your code to GitHub
2. Create a new project on Vercel
3. Connect your GitHub repository
4. Configure environment variables
5. Deploy!

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.