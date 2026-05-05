variable "project_id" {
  description = "The GCP Project ID to deploy resources to"
  type        = string
}

variable "region" {
  description = "The GCP region to deploy resources in"
  type        = string
  default     = "us-central1"
}

variable "app_name" {
  description = "The name of the application"
  type        = string
  default     = "p2m-accelerator"
}

variable "image_url" {
  description = "The URL of the Docker image in Artifact Registry (e.g., us-central1-docker.pkg.dev/project/repo/image:tag)"
  type        = string
}

variable "bucket_name" {
  description = "The name of the GCS bucket for video generation and fabrics. (Will be suffixed with project_id if not absolute)"
  type        = string
  default     = "p2m-accelerator-assets"
}

variable "video_folder" {
  description = "The folder name in GCS for video outputs"
  type        = string
  default     = "video_generation"
}

variable "fabric_library" {
  description = "The folder name in GCS for fabric library"
  type        = string
  default     = "fabric_library"
}
