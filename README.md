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
- **Workflow-Based Generation**: Step-by-step process with selection at each stage for optimal results
- **Two-Step Flat Generation**: Front view generated first, then used as reference for back view to ensure consistency
- **4-Variation Selection**: Choose from 4 AI-generated variations at both flat and rendering stages
- **Generation History**: Track all generations with timestamps and restore any previous version
- **Annotated Tech Packs**: Automatically generate annotated technical flats with measurement callouts
- **Smart Annotation Regeneration**: Annotations auto-update when flat changes, or regenerate independently
- **Combined Views**: Front and back views generated side-by-side in single images
- **Factory-Ready Flats**: Technical flats with proper line weights suitable for manufacturer production
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

The Tech Illustration workflow guides you through a step-by-step process to generate professional tech packs:

#### Step 1: Upload & Analyze
1. **Upload Sketch(es)**:
   - Upload a front view sketch (required)
   - Optionally upload a separate back view sketch
   - Or check "Front image includes both front and back views" if using a combined sketch
2. **Generate**: Click "Generate" to start the AI analysis
3. **AI Analysis**: AI analyzes your sketch for garment details, proportions, and measurements

#### Step 2: Select Technical Flat
1. **Review 4 Variations**: AI generates 4 technical flat variations using a two-step process:
   - Front view generated first with proper technical illustration standards
   - Back view generated using front as reference for consistency
2. **View Generation History**: Access previous generations via the history sidebar
3. **Select Preferred Variation**: Click on your preferred flat variation
4. **Regenerate** (Optional): Click "Regenerate" for 4 new variations if desired
5. **Continue**: Click "Continue with Variation X" to proceed

#### Step 3: Select Rendering
1. **Review 4 Rendering Variations**: AI generates 4 photorealistic rendering options
2. **View Generation History**: Track and restore previous rendering generations
3. **Select Preferred Rendering**: Click on your preferred rendering
4. **Regenerate** (Optional): Generate 4 new rendering variations if needed
5. **Continue**: Click "Continue with Variation X" to finalize

#### Step 4: Final Review & Export
1. **Review Complete Tech Pack**:
   - Your original sketch(es)
   - Selected photorealistic rendering (Front + Back)
   - Selected technical flat (Front + Back)
   - Annotated tech pack with measurement callouts
2. **Regenerate Options**:
   - **Regenerate Rendering**: Creates new rendering and auto-regenerates annotations
   - **Regenerate Technical Flat**: Creates new flat and auto-regenerates annotations
   - **Regenerate Annotations**: Regenerates only annotations for more detailed callouts
3. **Preview**: Click any image to view full screen
4. **Export**: Download individual images using the download button on each card
5. **Start Over**: Generate a new tech pack from different sketches

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
