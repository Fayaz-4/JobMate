# JobMate

JobMate is an AI-assisted career platform for students and freshers. It helps users build profiles, upload and analyze resumes, extract key skills, discover jobs through skill-based matching, and browse a daily digest of fresh opportunities.

## Overview

The project is split into two parts:

- `backend`: Spring Boot REST API with authentication, resume parsing, job management, dashboards, and AI-assisted extraction services.
- `frontend`: React + Vite single-page application for the user interface.

JobMate currently focuses on three core experience areas:

1. Resume upload and skill extraction
2. Skill-based job recommendations and matching
3. Daily digest jobs for newly posted opportunities

## Key Features

- User registration, login, password reset, and authenticated profile access
- Candidate profile management
- Resume upload, replace, delete, and download
- Resume parsing and extracted skill profile generation
- Skill-based job recommendation flow driven by resume competencies
- Job discovery, filtering, search, and recommended jobs
- Daily Digest page for fresh jobs posted today and yesterday
- Job details and application tracking
- Dashboard with user-specific stats
- Job fetching from external providers
- JWT-based authentication

## Tech Stack

### Backend

- Java 17
- Spring Boot 3.2
- Spring Web
- Spring Data JPA
- Spring Security
- JWT (`jjwt`)
- MySQL
- Apache PDFBox
- Apache POI
- Lombok

### Frontend

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Vapi web SDK

## Repository Structure

- `backend/` Spring Boot API
- `frontend/` React app
- `database/schema.sql` initial database schema
- `README.md` project documentation

## Backend Architecture

The backend follows a layered structure:

- `controller`: REST endpoints
- `service`: business logic
- `repository`: database access
- `entity`: JPA entities
- `dto`: request and response payloads
- `security`: JWT filter and security configuration
- `exception`: global error handling
- `util`: shared helpers such as JWT utilities

### Main Backend Modules

- Authentication
- Profile management
- Resume management
- Skill extraction
- Job management and job fetch pipeline
- Dashboard aggregation
- Application tracking
- Homepage stats
- Connectivity checks

## Frontend Architecture

The frontend is a React SPA with route-based pages and reusable UI components.

### Main Pages

- Home
- Login
- Register
- Forgot Password
- Reset Password
- Profile
- Resume Upload
- Skill Extraction
- Dashboard
- Job List
- Job Details
- Applications
- Today Digest
- Apply Redirect

### Shared UI

- Navbar
- Sidebar
- Footer
- Buttons, Inputs, Job Cards, Company Cards, Feature Cards, Logo

## Main Routes

Frontend routes are defined in `frontend/src/routes/AppRoutes.jsx` and include:

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/profile`
- `/resume-upload`
- `/skill-extraction`
- `/applications`
- `/dashboard`
- `/jobs`
- `/jobs/:id`
- `/today-digest`
- `/apply`

## API Base Path

The backend runs under:

- `http://localhost:8080/api`

The frontend API client uses `VITE_API_URL` if provided, otherwise it falls back to that local backend URL.

## Authentication

JobMate uses JWT authentication.

### Flow

1. User registers or logs in.
2. Backend returns a JWT access token.
3. Frontend stores the token in `localStorage`.
4. Axios automatically attaches the token on requests.
5. Unauthorized responses redirect the user to `/login`.

## Database Schema

The database schema is defined in `database/schema.sql`.

### Core Tables

- `users`
- `profiles`
- `resumes`
- `extracted_profiles`
- `dashboard_stats`
- `jobs`
- `applications`
- `skills_master`
- `homepage_stats`

### What the tables store

- `users`: authentication and account data
- `profiles`: candidate profile details
- `resumes`: uploaded resume metadata and file storage reference
- `extracted_profiles`: parsed resume content such as skills, education, projects, and experience
- `dashboard_stats`: user-specific dashboard counters
- `jobs`: job listings pulled from internal or external sources
- `applications`: saved application tracking data
- `skills_master`: master list of normalized skills
- `homepage_stats`: landing page counters

## Backend API Summary

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Jobs

- `GET /api/jobs`
- `GET /api/jobs/{id}`
- `GET /api/jobs/{id}/similar`
- `GET /api/jobs/today`
- `GET /api/jobs/recommended`
- `GET /api/jobs/search`
- `GET /api/jobs/filter`
- `POST /api/jobs`
- `POST /api/jobs/fetch`

### Resume

- `GET /api/resume`
- `POST /api/resume/upload`
- `PUT /api/resume/replace/{id}`
- `DELETE /api/resume/{id}`
- `GET /api/resume/download/{id}`
- `GET /api/resume/skills`

### Dashboard

- `GET /api/dashboard`
- `GET /api/dashboard/stats`
- `GET /api/dashboard/today-jobs`
- `GET /api/dashboard/todays-jobs`
- `GET /api/dashboard/recommended-jobs`
- `GET /api/dashboard/recent-applications`

### Other Modules

- Profile management endpoints
- Application tracking endpoints
- Skill extraction endpoints
- Home and connectivity endpoints

## External Integrations

The backend is prepared for integrations with:

- Job search providers
- AI services for resume parsing and skill extraction
- Voice or assistant features through Vapi

## Local Setup

### Prerequisites

- Java 17
- Maven
- Node.js 18+ recommended
- MySQL 8+

### Database Setup

1. Create a MySQL database named `jobmate_db`.
2. Run `database/schema.sql` to create the tables and seed homepage stats.

### Backend Setup

1. Open the `backend` folder.
2. Configure `src/main/resources/application.properties`.
3. Set the MySQL username, password, and any required API keys.
4. Run the backend with Maven.

Example:

```bash
mvn spring-boot:run
```

### Frontend Setup

1. Open the `frontend` folder.
2. Install dependencies.
3. Start the dev server.

Example:

```bash
npm install
npm run dev
```

## Environment Configuration

### Backend properties

The backend reads settings from `backend/src/main/resources/application.properties`.

Important values include:

- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`
- `jwt.secret`
- `jwt.expiration`
- `server.cors.allowed-origins`
- API keys for job and AI integrations

### Frontend environment

Optional frontend variable:

- `VITE_API_URL`

Example:

```bash
VITE_API_URL=http://localhost:8080/api
```

## Important Notes

- Do not commit real API keys or secrets into source control.
- The backend currently uses `ddl-auto=update`, so schema changes should still be reviewed carefully before production use.
- Some integrations depend on external APIs and may require valid credentials to work fully.

## Suggested Next Improvements

- Add a `.env.example` file for backend and frontend configuration
- Add API documentation with Swagger/OpenAPI
- Add automated tests for controllers and services
- Add deployment notes for production hosting

## Short Project Summary

JobMate is a full-stack career readiness platform that combines resume parsing, skill extraction, job discovery, and application tracking into one workflow for candidates.
