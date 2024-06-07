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
## Installation

Clone the repository:

```bash
  git clone https://github.com/yourusername/hostify.git
    cd hostify
```
Install backend & frontend dependencies:
```bash
  cd backend
    npm install
  cd frontend
    npm install
```
Set up environment variables:
```bash
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
```
