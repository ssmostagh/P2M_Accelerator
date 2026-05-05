output "url" {
  value       = google_cloud_run_v2_service.app_service.uri
  description = "The URL of the deployed Cloud Run service"
}

output "bucket_name" {
  value       = google_storage_bucket.assets_bucket.name
  description = "The name of the created GCS bucket"
}
