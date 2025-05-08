# Docker Environment Setup Guide

This document provides instructions for setting up environment variables for Docker deployment of the AetherAI Learning Management System.

## Environment Variables

Create a `.env` file in the root directory of the project with the following variables:

```
# Database Connection (Neon Database)
DATABASE_URL="postgresql://opal_owner:zBwb6eIZgx0y@ep-flat-base-a5xtcuot.us-east-2.aws.neon.tech/opal?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YnJpZWYtY2FsZi0xOS5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_3T86uKwpJiKeMv6EBdZi5vkLSzpPdpVktz7fMVY67H
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/auth/callback
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/auth/callback
CLERK_ALLOW_CLOCK_SKEW=true

# Stripe Payment

# Wix Integration
WIX_OAUTH_KEY=71497d85-463d-4083-bc76-bb201928b057

# OpenAI
OPEN_AI_KEY=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

# Voiceflow
NEXT_PUBLIC_VOICE_FLOW_KEY=6812a8f79f132e62dd6e1996
VOICEFLOW_API_KEY=VF.DM.6812fd72faf415556f8932d0.56YzcQmHTefwPd21
VOICEFLOW_KNOWLEDGE_BASE_API=https://api.voiceflow.com/v1/knowledge-base/docs/upload/table?overwrite=false

# URLs
NEXT_PUBLIC_HOST_URL=http://localhost:3000
NEXT_PUBLIC_CLOUD_FRONT_STREAM_URL=https://res.cloudinary.com/dehyychku/video/upload/v1746133637/opal
NEXT_PUBLIC_EXPRESS_SERVER_URL=http://localhost:5000
EXPRESS_SERVER_URL=http://localhost:5000

# Email
MAILER_PASSWORD=xtlt labq hcvx kqya
MAILER_EMAIL=ekfrimpong107@gmail.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=dehyychku
CLOUDINARY_API_KEY=821864697235452
CLOUDINARY_API_SECRET=A5Irj5gktPK2OG67vqKzJ7bckdo

# Other
CLOUD_WAYS_POST=
```

## Running with Docker Compose

After setting up the `.env` file, you can start the application with:

```bash
docker-compose up -d
```

This will start the Next.js application on port 3000.

## Database Management

This application is configured to use a Neon database. No local database setup is required.

To apply database migrations, you can run:

```bash
docker-compose exec lms-app npx prisma migrate deploy
```

## Accessing the Application

Once the service is running, the application will be available at:
- http://localhost:3000 