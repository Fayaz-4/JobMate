-- Create Database
CREATE DATABASE IF NOT EXISTS jobmate_db;
USE jobmate_db;

-- 1. Create users table for Authentication
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL DEFAULT 'CANDIDATE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create homepage_stats table for Landing Page Metrics
CREATE TABLE IF NOT EXISTS homepage_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_jobs INT NOT NULL DEFAULT 0,
    total_companies INT NOT NULL DEFAULT 0,
    total_users INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Insert default mock landing page statistics
INSERT INTO homepage_stats (id, total_jobs, total_companies, total_users) 
VALUES (1, 1200, 250, 5000) 
ON DUPLICATE KEY UPDATE 
    total_jobs = 1200, 
    total_companies = 250, 
    total_users = 5000;

-- 4. Create profiles table for Candidate Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    location VARCHAR(255),
    degree VARCHAR(255),
    specialization VARCHAR(255),
    college_name VARCHAR(255),
    graduation_year INT,
    cgpa DOUBLE,
    preferred_role VARCHAR(255) NOT NULL,
    preferred_location VARCHAR(255) NOT NULL,
    experience_level VARCHAR(50),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    skills TEXT,
    profile_completion INT NOT NULL DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME,
    CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create resumes table for Candidate Resumes
CREATE TABLE IF NOT EXISTS resumes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    upload_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    uploaded_at DATETIME NOT NULL,
    updated_at DATETIME,
    CONSTRAINT fk_resumes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create extracted_profiles table for Skill Extraction Module
CREATE TABLE IF NOT EXISTS extracted_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    resume_id BIGINT,
    skills TEXT,
    education TEXT,
    projects TEXT,
    experience TEXT,
    keywords TEXT,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_extracted_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_extracted_profiles_resume FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Create dashboard_stats table for Dashboard Module
CREATE TABLE IF NOT EXISTS dashboard_stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    matched_jobs INT NOT NULL DEFAULT 0,
    applications INT NOT NULL DEFAULT 0,
    interviews INT NOT NULL DEFAULT 0,
    selected_jobs INT NOT NULL DEFAULT 0,
    todays_jobs INT NOT NULL DEFAULT 0,
    profile_completion INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_dashboard_stats_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Create jobs table for Jobs Explorer Module
CREATE TABLE IF NOT EXISTS jobs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    salary VARCHAR(255) NOT NULL,
    experience VARCHAR(255) NOT NULL,
    job_type VARCHAR(100) NOT NULL,
    work_mode VARCHAR(100) NOT NULL,
    job_source VARCHAR(100) NOT NULL,
    job_url VARCHAR(500),
    description TEXT,
    skills_required VARCHAR(500),
    posted_date DATE NOT NULL,
    bond_period VARCHAR(255),
    probation_period VARCHAR(255),
    notice_period VARCHAR(255),
    company_website VARCHAR(255),
    created_at DATETIME NOT NULL,
    updated_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Create applications table for Applications Tracking Module
CREATE TABLE IF NOT EXISTS applications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    job_id BIGINT,
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    application_source VARCHAR(255) NOT NULL,
    application_url VARCHAR(500),
    applied_date DATE NOT NULL,
    status VARCHAR(100) NOT NULL DEFAULT 'Applied',
    current_round VARCHAR(255),
    notes TEXT,
    last_updated DATETIME NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    CONSTRAINT fk_applications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_applications_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Create skills_master table for Technical Skills Registry
CREATE TABLE IF NOT EXISTS skills_master (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    skill_name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
