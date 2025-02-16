# Utakara

A Next.js application for managing Japanese songs.

## Prerequisites

- Node.js 18 or later
- Docker (optional)

## Installation

### Method 1: Using Docker

1. Clone the repository:
```bash
git clone [repository-url]
cd utakara
```

2. Create a `.env` file in the root directory:
```bash
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
```

3. Build and run with Docker:
```bash
docker build -t utakara .
docker run -p 6666:6666 utakara
```

4. Open [http://localhost:6666](http://localhost:6666) in your browser

### Method 2: Direct Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd utakara
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
```

4. Set up the database:
```bash
npm run migrate
```

5. Build and start the application:
```bash
npm run build
npm start
```

6. Open [http://localhost:6666](http://localhost:6666) in your browser

## Development

Run the development server:

```bash
npm run dev
```

The app will run on [http://localhost:6666](http://localhost:6666) with hot-reload enabled.

## Features

- Japanese song management with furigana support
- Admin interface for song management
- Interactive particle background
- Search functionality
- Mobile-responsive design

## Technologies

- Next.js 15
- TypeScript
- SQLite (better-sqlite3)
- TailwindCSS
- Framer Motion
- Next Auth for authentication

## Learn More

To learn more about Next.js, take a look at the following resources:
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
