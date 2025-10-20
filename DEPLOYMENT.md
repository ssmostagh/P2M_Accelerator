
# Deployment to Google Cloud Run via Cloud Shell

This guide provides step-by-step instructions to deploy this application to Google Cloud Run using the Cloud Shell. This method uses the service account identity for authentication, which is the recommended best practice for Google Cloud environments.

## 1. Prerequisites

- You have a Google Cloud Project with billing enabled.
- You have the application source code ready in your Cloud Shell environment (e.g., by cloning the repository).

## 2. Initial Setup in Cloud Shell

First, open the Cloud Shell from the Google Cloud Console.

### a. Set Your Project

Set the `gcloud` CLI to use your target project. Replace `[PROJECT_ID]` with your actual Google Cloud project ID.

```sh
gcloud config set project [PROJECT_ID]
```

### b. Enable Required APIs

Run the following command to enable all the necessary services for building, storing, deploying, and running the application:

```sh
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  aiplatform.googleapis.com
```

## 3. Build the Container Image

We will use Cloud Build to build a container image and push it to Artifact Registry.

### a. Create an Artifact Registry Repository

Create a repository to store your container images. Replace `[REGION]` with your preferred region (e.g., `us-central1`).

```sh
gcloud artifacts repositories create ufp-design-studio-repo \
  --repository-format=docker \
  --location=[REGION] \
  --description="Repository for UFP Design Studio images"
```

### b. Start the Build

From the root directory of the application (where the `Dockerfile` is located), run the following command. This tells Cloud Build to build your container and tag it with a name in your new repository.

```sh
# Replace [PROJECT_ID] and [REGION]
gcloud builds submit --tag us-central1-docker.pkg.dev/cpg-cdp/ufp-design-studio-repo/ufp-design-studio:latest .
```

## 4. Deploy to Cloud Run

Now, deploy the container image to Cloud Run. This command creates a public-facing service.

### a. Grant Vertex AI Permissions to the Service Account

By default, Cloud Run services use the Compute Engine default service account. You need to grant this account permission to use Vertex AI.

```sh
# Replace [PROJECT_NUMBER] with your project's number (not ID)
# You can find it on the Google Cloud Console home page.
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:939655404703-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```
*Note: If you configure your Cloud Run service to use a different service account, grant the `Vertex AI User` role to that account instead.*

### b. Deploy the Service

Run the deployment command. Replace `[PROJECT_ID]` and `[REGION]` with your values.

```sh
# Replace [PROJECT_ID] and [REGION]
gcloud run deploy ufp-design-studio \
  --image=us-central1-docker.pkg.dev/cpg-cdp/ufp-design-studio-repo/ufp-design-studio:latest \
  --region=us-central1 \
  --allow-unauthenticated
```

- `--allow-unauthenticated` makes the service publicly accessible.
- The application will automatically use the service account's identity for authentication with the Gemini API. No API key is needed.

## 5. Access Your Application

After the deployment completes, the command will output a **Service URL**. You can visit this URL in your browser to see your live application.
