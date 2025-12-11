# P2M Accelerator: Micro-Trend Studio

A comprehensive fashion design platform powered by Google's Gemini AI, featuring virtual garment try-on, AI-powered moodboard creation, and sketch-to-tech pack conversion. This tool enables designers to visualize garments on models, apply fabric changes, generate front and back views, create dynamic catwalk videos, generate themed color palettes, and transform hand-drawn sketches into professional technical illustrations ready for production.

## Features

### Design Studio

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
- **Smart Color Regeneration**: Regenerate individual colors with controls for lighter, darker, warmer, and cooler alternatives
- **AI Image Prompts**: Generate detailed image prompts for each color based on your theme
- **Pantone Integration**: Access to a comprehensive Pantone color database with intelligent filtering
- **Export & Share**: Download color palettes and image prompts in organized panels
- **Flexible Layouts**: Choose from 4-color, 6-color, or 8-color palette layouts

### Tech Illustration

- **Sketch-to-Tech Pack**: Transform hand-drawn sketches into professional technical illustrations
- **AI Analysis**: Automatic garment analysis with detailed proportions and measurements
- **Dual Output**: Generate both photorealistic renderings and technical flats
- **Combined Views**: Front and back views generated side-by-side in single images
- **Regeneration with Feedback**: Regenerate specific images with custom feedback for iterative refinement
- **Consistency Control**: Built-in consistency requirements ensure front and back views match
- **Factory-Ready Flats**: Technical flats suitable for manufacturer production with proper line weights and details
- **Multiple Upload Options**: Support for separate front/back sketches or combined front+back images

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

### 4. Service Account Setup and Permissions

This application requires specific Google Cloud permissions to function properly. You can either use your personal account or create a dedicated service account.

#### Option A: Using Your Personal Account

If running locally with your own credentials:

```bash
gcloud auth application-default login
```

Ensure your account has the following roles:
- `roles/aiplatform.user` - For Vertex AI API access
- `roles/storage.objectAdmin` - For GCS bucket access

#### Option B: Using a Service Account (Recommended for Production)

1. **Create a service account**:

```bash
gcloud iam service-accounts create p2m-accelerator-sa \
  --display-name="P2M Accelerator Service Account" \
  --project=your-project-id
```

2. **Grant required IAM roles**:

```bash
# Grant Vertex AI User role (for Gemini and Veo models)
gcloud projects add-iam-policy-binding your-project-id \
  --member="serviceAccount:p2m-accelerator-sa@your-project-id.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Grant Storage Object Admin role (for video generation storage)
gcloud projects add-iam-policy-binding your-project-id \
  --member="serviceAccount:p2m-accelerator-sa@your-project-id.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

3. **Create and download service account key**:

```bash
gcloud iam service-accounts keys create ./service-account-key.json \
  --iam-account=p2m-accelerator-sa@your-project-id.iam.gserviceaccount.com
```

4. **Set the credentials environment variable**:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"
```

Or add to your `.env` file:
```env
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

#### Required Permissions Summary

| Role | Purpose | Permissions Included |
|------|---------|---------------------|
| `roles/aiplatform.user` | Access Vertex AI models (Gemini 2.5 Flash, Gemini 2.5 Pro, Veo 3.1) | `aiplatform.endpoints.predict`<br>`aiplatform.models.get`<br>`aiplatform.models.list` |
| `roles/storage.objectAdmin` | Read/write access to GCS bucket for video storage | `storage.objects.create`<br>`storage.objects.delete`<br>`storage.objects.get`<br>`storage.objects.list` |

**Security Best Practices**:
- Never commit service account keys to version control
- Add `service-account-key.json` to your `.gitignore`
- For production deployments, use Workload Identity or service account impersonation instead of key files
- Rotate service account keys regularly

## Installation

1. **Clone the repository**:

```bash
git clone <repository-url>
cd P2M_Accelerator
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
P2M_Accelerator/
├── components/           # React components
│   ├── ColorCard.tsx    # Individual color swatch with regeneration controls
│   ├── FinalizePanel.tsx
│   ├── EditStudio.tsx
│   ├── VirtualTryOn.tsx
│   ├── FabricLibrary.tsx
│   ├── HistoryPanel.tsx
│   ├── VideoPlayerModal.tsx
│   ├── TechPackImageUploader.tsx   # Tech illustration sketch uploader
│   ├── TechPackResultCard.tsx      # Tech pack result display with regeneration
│   ├── TechPackSpinner.tsx         # Loading spinner for tech pack generation
│   └── TechPackImagePreviewModal.tsx
├── pages/               # Page components
│   ├── LandingPage.tsx            # Home page with navigation
│   ├── MicroTrendStudio.tsx       # Main Micro-Trend Studio application
│   ├── MoodboardPage.tsx          # Moodboard AI interface
│   └── TechIllustrationPage.tsx   # Tech Illustration/Tech Pack generator
├── services/            # API service layer
│   └── geminiService.ts
├── constants/           # Static data and configurations
│   ├── pantoneColors.js  # Pantone color database
│   └── studioConstants.ts # Fabric library definitions
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

### Design Studio

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
5. **Regenerate Colors**: Hover over individual color cards to access controls:
   - Generate a lighter shade (↑ Lighter button)
   - Generate a darker shade (↓ Darker button)
   - Generate a warmer tone (🔥 Warmer button)
   - Generate a cooler tone (❄️ Cooler button)
   - Get a theme-appropriate alternative (Smart Pick button)
6. **View Image Prompts**: Generated AI image prompts for each color provide visual inspiration
7. **Export**: Download the complete moodboard with all colors and prompts

### Tech Illustration

1. **Upload Sketch(es)**:
   - Upload a front view sketch (required)
   - Optionally upload a separate back view sketch
   - Or check "Front image includes both front and back views" if using a combined sketch
2. **Generate Tech Pack**: Click "Generate" to create AI-powered technical illustrations
3. **AI Processing**:
   - AI analyzes your sketch for garment details, proportions, and measurements
   - Generates photorealistic rendering with front and back views side-by-side
   - Generates technical flat with front and back views side-by-side
4. **Review Results**: View three cards:
   - Your original sketch(es)
   - Photorealistic rendering (Front + Back)
   - Technical flat (Front + Back)
5. **Regenerate with Feedback** (Optional):
   - Click "Regenerate with Feedback" on any generated image
   - Provide specific instructions (e.g., "shoulder should have bows not leaves")
   - Click "Generate" to create an updated version
   - Or use the quick regenerate icon to try a different variation without changes
6. **Preview**: Click on any image to view it in full screen
7. **Export**: Download individual images using the download button on each card
8. **Start Over**: Click "Start Over" to generate a new tech pack from different sketches

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
