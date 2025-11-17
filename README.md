# P2M Accelerator: Micro-Trend Studio

A powerful web application for virtual garment try-on, fashion design, and AI-powered moodboard creation, powered by Google's Gemini AI. This tool allows users to visualize garments on models, apply fabric changes, generate front and back views, create dynamic catwalk videos, and generate themed color palettes with image prompts for design inspiration.

## Features

### Micro-Trend Studio

- **Virtual Try-On**: Seamlessly place garments on model images with realistic rendering
- **AI-Powered Design**: Generate multiple variations of designs using Gemini 2.5 Flash
- **Fabric Library**: Apply different fabric patterns and textures to garments with locally generated swatches
- **Multi-View Generation**: Automatically generate front and back views
- **Edit Studio**: Make iterative edits with natural language prompts
- **Video Generation**: Create catwalk-style videos using Veo 3.1
- **History Tracking**: Keep track of all design iterations
- **Export Options**: Download finalized images and videos

### Moodboard AI

- **Theme-Based Color Palettes**: Generate curated Pantone color palettes based on design themes and keywords
- **Smart Color Regeneration**: Regenerate individual colors with controls for lighter, darker, or random alternatives
- **AI Image Prompts**: Generate detailed image prompts for each color based on your theme
- **Pantone Integration**: Access to a comprehensive Pantone color database with intelligent filtering
- **Export & Share**: Download color palettes and image prompts in organized panels
- **Flexible Layouts**: Choose from 4-color, 6-color, or 8-color palette layouts

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express
- **AI Models**:
  - Gemini 2.5 Flash for image editing
  - Gemini 2.5 Pro for garment description
  - Veo 3.1 for video generation
- **Cloud Services**: Google Cloud Storage, Vertex AI

## Prerequisites

Before setting up the project, ensure you have:

- **Node.js** (v18 or higher) and **npm**
- **Google Cloud Project** with billing enabled
- **gcloud CLI** installed and authenticated

## Google Cloud Setup

### 1. Enable Required APIs

Enable the following APIs in your Google Cloud project:

```bash
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable storage-component.googleapis.com
```

Or enable them via the [Google Cloud Console](https://console.cloud.google.com/apis/library):
- Vertex AI API
- Cloud Storage API

### 2. Create a Google Cloud Storage Bucket

Create a GCS bucket for storing generated videos:

```bash
gcloud storage buckets create gs://your-bucket-name \
  --project=your-project-id \
  --location=us-central1 \
  --uniform-bucket-level-access
```

### 3. Authenticate with Google Cloud

Authenticate your local environment:

```bash
gcloud auth application-default login
```

This creates credentials that the application will use to access Google Cloud services.

### 4. Set Required Permissions

Ensure your account or service account has the following roles:
- `roles/aiplatform.user` - For Vertex AI API access
- `roles/storage.objectAdmin` - For GCS bucket access

## Installation

1. **Clone the repository**:

```bash
git clone <repository-url>
cd UFP
```

2. **Install dependencies**:

```bash
npm install
```

3. **Configure environment variables**:

Copy the example environment file and update it with your values:

```bash
cp .env.example .env
```

Edit `.env` with your Google Cloud configuration:

```env
# Google Cloud Configuration
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# Google Cloud Storage
GCS_BUCKET_NAME=your-bucket-name
GCS_VIDEO_FOLDER=video_generation
```

## Running the Application

### Development Mode

Start both the frontend development server and backend server concurrently:

```bash
npm start
```

This will:
- Start the Vite dev server on `http://localhost:5173`
- Start the Express backend server on `http://localhost:8080`
- Enable hot module reloading for the frontend

### Production Build

1. **Build the frontend**:

```bash
npm run build
```

2. **Start the production server**:

```bash
node server.js
```

3. **Access the application**:

Open your browser and navigate to `http://localhost:8080`

### Preview Production Build Locally

To preview the production build without running the backend:

```bash
npm run serve
```

## Project Structure

```
UFP/
├── components/           # React components
│   ├── ColorCard.tsx    # Individual color swatch with regeneration controls
│   ├── FinalizePanel.tsx
│   ├── EditStudio.tsx
│   ├── VirtualTryOn.tsx
│   ├── FabricLibrary.tsx
│   ├── HistoryPanel.tsx
│   └── VideoPlayerModal.tsx
├── pages/               # Page components
│   ├── LandingPage.tsx  # Home page with navigation
│   ├── UFPDesignStudio.tsx  # Main Micro-Trend Studio application
│   └── MoodboardPage.tsx    # Moodboard AI interface
├── services/            # API service layer
│   └── geminiService.ts
├── constants/           # Static data and configurations
│   ├── pantoneColors.js # Pantone color database
│   └── ufpConstants.ts  # Fabric library definitions
├── types/               # TypeScript type definitions
│   └── index.ts
├── public/              # Static assets
│   └── swatches/        # Generated fabric swatch images
├── server.js            # Express backend server
├── App.tsx              # React Router configuration
├── main.tsx             # React entry point
├── index.html           # HTML template
├── dist/                # Production build output
└── .env                 # Environment variables (not committed)
```

## Usage

### Micro-Trend Studio

1. **Upload Images**: Upload a model image and a garment image
2. **Generate Initial Design**: Click "Generate Design" to create virtual try-on variations
3. **Select Variation**: Choose your preferred variation from the generated options
4. **Edit Design**: Use the edit studio to make changes with natural language prompts
5. **Apply Fabrics**: Select fabrics from the library to apply to specific garments
6. **Finalize Front**: Click "Finalize Front Design" when satisfied
7. **Generate Back View**: Automatically generate the back view of the garment
8. **Finalize Back**: Review and finalize the back view
9. **Generate Video**: Create a catwalk video showing front and back views
10. **Export**: Download finalized images and videos

### Moodboard AI

1. **Enter Theme**: Input your design theme or keywords (e.g., "dark academia", "coastal grandmother", "urban streetwear")
2. **Choose Layout**: Select your preferred panel layout (4, 6, or 8 colors)
3. **Generate Palette**: Click "Generate Moodboard" to create a curated Pantone color palette
4. **Review Colors**: Each color card displays the Pantone name, code, and hex value
5. **Regenerate Colors**: Click on individual color cards to:
   - Generate a lighter shade (↑ Lighter button)
   - Generate a darker shade (↓ Darker button)
   - Get a random alternative (refresh icon)
6. **View Image Prompts**: Generated AI image prompts for each color provide visual inspiration
7. **Export**: Download the complete moodboard with all colors and prompts

## Troubleshooting

### Authentication Errors

If you see authentication errors, ensure:
- `gcloud auth application-default login` has been run
- Your Google Cloud project has billing enabled
- Required APIs are enabled

### Video Generation Issues

If video generation fails:
- Verify the GCS bucket exists and is accessible
- Check that the bucket location matches `GOOGLE_CLOUD_LOCATION`
- Ensure your account has `storage.objectAdmin` role

### Port Already in Use

If port 8080 is already in use, set a different port:

```bash
PORT=3000 node server.js
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_CLOUD_PROJECT` | Yes | - | Your Google Cloud project ID |
| `GOOGLE_CLOUD_LOCATION` | No | `us-central1` | Google Cloud region for Vertex AI |
| `GCS_BUCKET_NAME` | Yes | - | GCS bucket name for video storage |
| `GCS_VIDEO_FOLDER` | No | `video_generation` | Folder path within the bucket |
| `PORT` | No | `8080` | Port for the Express server |

## License

[Add your license here]

## Credits

Built by: mostaghim@
