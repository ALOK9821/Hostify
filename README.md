# Hostify
A simple deployment service for React applications, inspired by Vercel. Designed to make the deployment process easy and automated, from uploading your code to serving it live.

## Features

### Upload Service
- **Setup**: Built with Node.js, TypeScript, Express, and Redis.
- **Functionality**:
  - Clone your repository.
  - Generate a unique session ID.
  - Upload files to Cloud Bucket (AWS S3 / Couldflare R2).
  - Use Redis queues to manage upload status.

### Deploy Service
- **Setup**: TypeScript-based service.
- **Functionality**:
  - Download files from S3.
  - Build the React app into HTML/CSS.
  - Re-upload the build directory to S3.

### Request Handler
- **Setup**: Node.js project with TypeScript configurations.
- **Functionality**:
  - Handle incoming requests.
  - Fetch content from S3 based on subdomains.
  - Serve the final HTML files with correct headers.

## Getting Started

### Prerequisites
- Node.js
- AWS / Couldflare account
- Redis

