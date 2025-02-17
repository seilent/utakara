# Utakara

Personal list to add your favorite song, and lyrics (including romaji).  
It's not an automatic process, more like manual entry database with YouTube integration for audio playback.

## Features

- Add and manage songs with Japanese and English titles/artists
- Automatic YouTube search and audio integration
- Audio playback with waveform visualization
- Background download queue with retry support
- Configurable audio storage (local or proxy)
- Romaji lyrics support

![chrome_wguPz3d6x3](https://github.com/user-attachments/assets/17744d1c-83b3-4850-af86-793ce1c543e0)


![chrome_Le4qeKJFdB](https://github.com/user-attachments/assets/2d05169c-6ea5-480c-aa58-651032c34624) ![chrome_ytSMgG5x1n](https://github.com/user-attachments/assets/7011a4c0-5735-4a6d-b541-9307117289be)



## Prerequisites

- Node.js 18 or later
- Python 3 (required for building native dependencies)
- FFmpeg (required for audio processing)
  - Windows: Download from [FFmpeg Builds](https://github.com/BtbN/FFmpeg-Builds/releases)
    1. Download the latest `ffmpeg-n*.*.*-win64-gpl-*.zip`
    2. Extract the ZIP file
    3. Copy `ffmpeg.exe` and `ffprobe.exe` from the `bin` folder to `utakara/bin/`
  - Linux: `sudo apt install ffmpeg` (Ubuntu/Debian) or `sudo dnf install ffmpeg` (Fedora)
  - macOS: `brew install ffmpeg`
- Build tools (for non-Docker installation):
  - Linux: `make`, `g++`, `pkgconfig`, `cairo-dev`, `pango-dev`, `jpeg-dev`, `giflib-dev`, `librsvg-dev`
  - Windows: Visual Studio Build Tools with C++ workload
  - macOS: Xcode Command Line Tools
- Docker (optional, includes all build dependencies)
- YouTube Data API v3 key (for auto-searching songs)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Admin credentials (optional, defaults to "admin")
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password

# Required for NextAuth.js session encryption
NEXTAUTH_SECRET=your_random_secret_key

# Required for YouTube API (for auto-searching songs)
YOUTUBE_API_KEY=your_youtube_api_key

# Audio storage configuration (optional)
AUDIO_STORAGE=local # or "proxy"
AUDIO_PROXY_URL=https://your-proxy-url.com # required if using proxy storage
```

### YouTube API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API key)
5. Copy the API key to your .env file

### Audio Storage Configuration

The application supports two modes for audio storage:

1. **Local Storage (default)**
   - Audio files are downloaded and stored locally
   - Better performance and reliability
   - Requires more disk space

2. **Proxy Storage**
   - Audio is streamed through a proxy server
   - No local storage required
   - Requires setting up a proxy server
   - Set `AUDIO_STORAGE=proxy` and configure `AUDIO_PROXY_URL`

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
