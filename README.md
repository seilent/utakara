# Utakara

Personal list to add your favorite song, and lyrics (including romaji).  
It's not an automatic process, more like manual entry database.  

![chrome_wguPz3d6x3](https://github.com/user-attachments/assets/17744d1c-83b3-4850-af86-793ce1c543e0)


![chrome_Le4qeKJFdB](https://github.com/user-attachments/assets/2d05169c-6ea5-480c-aa58-651032c34624) ![chrome_ytSMgG5x1n](https://github.com/user-attachments/assets/7011a4c0-5735-4a6d-b541-9307117289be)



## Prerequisites

- Node.js 18 or later
- Python 3 (required for building native dependencies)
- Build tools (for non-Docker installation):
  - Linux: `make`, `g++`, `pkgconfig`, `cairo-dev`, `pango-dev`, `jpeg-dev`, `giflib-dev`, `librsvg-dev`
  - Windows: Visual Studio Build Tools with C++ workload
  - macOS: Xcode Command Line Tools
- Docker (optional, includes all build dependencies)

## Installation

### Method 1: Using Docker (still broken)

1. Clone the repository:
```bash
git clone [repository-url]
cd utakara
```

2. Create a `.env` file in the root directory:
```bash
ADMIN_USERNAME=your_admin_username # Optional, defaults to "admin"
ADMIN_PASSWORD=your_admin_password # Optional, defaults to "admin"
NEXTAUTH_SECRET=your_random_secret_key # Required for NextAuth.js session encryption
```
You can generate a secure NEXTAUTH_SECRET by:
- Using the [NextAuth Secret Generator](https://generate-secret.vercel.app/32)
- Or running this command: `node -e "console.log(crypto.randomBytes(32).toString('hex'))"`

3. Build and run with Docker:
```bash
docker build -t utakara .
docker run -p 4000:4000 --env-file .env utakara
```

4. Open [http://localhost:4000](http://localhost:4000) in your browser

### Method 2: Direct Installation

1. Clone the repository:
```bash
git clone https://github.com/seilent/utakara
cd utakara
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
ADMIN_USERNAME=your_admin_username # Optional, defaults to "admin"
ADMIN_PASSWORD=your_admin_password # Optional, defaults to "admin"
NEXTAUTH_SECRET=your_random_secret_key # Required for NextAuth.js session encryption
```
You can generate a secure NEXTAUTH_SECRET by:
- Using the [NextAuth Secret Generator](https://auth-secret-gen.vercel.app/)
- Or running this command: `node -e "console.log(crypto.randomBytes(32).toString('hex'))"`

4. Build and start the application:
```bash
npm run build
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser


## Admin Interface

The admin interface is accessible at `/admin` after logging in to add songs. 

## Default Credentials
The default login credentials are:
- Username: admin
- Password: admin

It is highly recommended to change these credentials after your first login.

To access the admin interface:
1. Navigate to `/admin` or click the admin link in the navigation
2. Log in with your credentials

### Changing Admin Credentials
1. Log in to the application using your current credentials
2. Navigate to `/admin/settings` in your browser
3. Under the "Change Credentials" section, enter:
   - Your current password
   - Your new desired username
   - Your new desired password
4. Click "Update Credentials" to save the changes

## Development

Run the development server:

```bash
npm run dev
```

The app will run on [http://localhost:3000](http://localhost:3000) with hot-reload enabled.
