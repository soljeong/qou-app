#!/bin/bash

# Configuration
PROJECT_ID="YOUR_PROJECT_ID" # Replace with your GCP Project ID
REGION="asia-northeast3"     # Seoul region, change if needed
SERVICE_NAME="qou-app"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"
DATABASE_URL="postgresql://neondb_owner:npg_ogO60awIjqrm@ep-late-heart-aebalfo6-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

echo "Deploying $SERVICE_NAME to Google Cloud Run..."

# 1. Build the image using Cloud Build
echo "Building container image..."
gcloud builds submit --tag $IMAGE_NAME

# 2. Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="$DATABASE_URL"

echo "Deployment complete!"
