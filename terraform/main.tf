provider "google" {
  project = var.project_id
  region  = var.region
}

# --- Service Account ---
resource "google_service_account" "app_sa" {
  account_id   = "${var.app_name}-sa"
  display_name = "Service Account for ${var.app_name}"
}

# --- IAM Permissions ---
# Storage Admin on the assets bucket
resource "google_project_iam_member" "storage_admin" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}

# Vertex AI User for Gemini
resource "google_project_iam_member" "aiplatform_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.app_sa.email}"
}

# --- Storage Bucket ---
resource "google_storage_bucket" "assets_bucket" {
  name          = "${var.bucket_name}-${var.project_id}" # Ensure global uniqueness
  location      = "US" # Multi-region or regional
  force_destroy = true # WARNING: destroy bucket contents on tf destroy

  uniform_bucket_level_access = true

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# --- Cloud Run ---
resource "google_cloud_run_v2_service" "app_service" {
  name     = var.app_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.app_sa.email

    containers {
      image = var.image_url

      ports {
        container_port = 8080
      }

      env {
        name  = "GOOGLE_GENAI_USE_VERTEXAI"
        value = "true"
      }
      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project_id
      }
      env {
        name  = "GOOGLE_CLOUD_LOCATION"
        value = var.region
      }
      env {
        name  = "GCS_BUCKET_NAME"
        value = google_storage_bucket.assets_bucket.name
      }
      env {
        name  = "GCS_VIDEO_FOLDER"
        value = var.video_folder
      }
      env {
        name  = "GCS_FABRIC_LIBRARY"
        value = var.fabric_library
      }
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
}

# Allow unauthenticated access (Public app)
resource "google_cloud_run_v2_service_iam_member" "allow_unauth" {
  location = google_cloud_run_v2_service.app_service.location
  project  = google_cloud_run_v2_service.app_service.project
  name     = google_cloud_run_v2_service.app_service.name
  role     = "roles/run.viewer"
  member   = "allUsers"
}
