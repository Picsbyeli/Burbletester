# Overview

Burble is a full-stack brain teaser and word game platform that offers multiple game modes including word puzzles, emoji riddles, and interactive question games. The application features both a web interface and a Chrome extension, providing users with engaging puzzle experiences across different difficulty levels and categories.

The platform includes user authentication, progress tracking, AI-powered content generation, a comprehensive scoring system, and profile picture uploads with Replit's object storage integration. Games include "Burble Word Game" (similar to Wordle), "Emoji Guess" (decode emoji combinations), and "Are You My Valentine?" (a Twenty Questions variant).

# Recent Changes

**December 2024: Profile Picture Upload System**
- Successfully replaced complex avatar customization system with simple profile picture upload functionality
- Integrated Replit's App Storage (object storage) service for persistent file uploads with proper authentication and ACL policies
- Updated database schema to add `profile_image_url` column to users table for storing uploaded image URLs
- Created ProfilePictureUpload component with file upload, preview, and management capabilities
- Updated all avatar display components (header, leaderboard, sidebar, profile page) to show uploaded profile pictures with fallbacks to initials
- Fixed Passport.js authentication integration for upload endpoints (resolved session.passport.user vs session.userId issue)
- Fixed profile page tab functionality by properly organizing layout: profile picture → tab buttons → tab content with stats

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React + TypeScript**: Modern component-based UI built with React 18+ and TypeScript for type safety
- **Vite**: Fast build tool and development server for optimal developer experience
- **Tailwind CSS + shadcn/ui**: Utility-first CSS framework with pre-built UI components for consistent design
- **TanStack Query**: Powerful data fetching and state management for server state synchronization
- **React Hook Form + Zod**: Form handling with runtime validation and type safety

## Backend Architecture
- **Express.js**: RESTful API server with middleware-based architecture
- **TypeScript**: Full type safety across the entire backend codebase
- **Session-based Authentication**: Passport.js with local strategy and session management
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **AI Integration**: Perplexity API for generating riddles, hints, and content

## Data Storage Solutions
- **PostgreSQL**: Primary database using Neon serverless for scalability
- **Session Store**: PostgreSQL-backed session storage with connect-pg-simple
- **Local Storage**: Chrome extension uses browser storage APIs for offline functionality

## Authentication & Authorization
- **Passport.js**: Local strategy with username/password authentication
- **Session Management**: Server-side sessions with secure cookie configuration
- **Password Security**: Scrypt-based password hashing with salt
- **Email Verification**: Token-based email verification system (configured but optional)

## Content Generation System
- **AI-Powered Content**: Perplexity API integration for generating riddles, emoji puzzles, and word lists
- **Batch Generation**: Automated scripts for creating large content datasets
- **Profanity Filtering**: Custom filter to ensure appropriate content
- **Content Validation**: Dictionary API integration to verify word validity

## Game Logic Architecture
- **Modular Game Systems**: Separate modules for each game type (Burble, Emoji, Valentine)
- **Difficulty Scaling**: Dynamic difficulty adjustment based on user preferences
- **Progress Tracking**: Comprehensive user statistics and progress monitoring
- **Scoring System**: Points-based scoring with time bonuses and difficulty multipliers

## Chrome Extension Architecture
- **Manifest V3**: Modern Chrome extension with service worker background script
- **Offline First**: Games function without internet connection using local data
- **API Integration**: Optional synchronization with main web application
- **Mock Data System**: Fallback content when offline or API unavailable

# External Dependencies

## Third-Party APIs
- **Perplexity AI**: Content generation for riddles, emoji puzzles, and hints
- **Dictionary API**: Word validation for game mechanics
- **Nodemailer**: Email service for user verification and notifications
- **Spotify Web API**: Music search and streaming integration (using manual client credentials)
- **YouTube Data API v3**: Music search and video integration
- **Apple Music API**: Future integration planned (requires MusicKit.js setup)

## Database & Infrastructure
- **Neon PostgreSQL**: Serverless PostgreSQL database with WebSocket connections
- **Drizzle Kit**: Database migrations and schema management

## UI & Styling
- **Radix UI**: Accessible, unstyled UI components as foundation
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library for consistent iconography
- **Canvas Confetti**: Victory animations and celebrations

## Development & Build Tools
- **Vite**: Frontend build tool and development server
- **ESBuild**: Fast bundling for production builds
- **Puppeteer**: Automated screenshot generation for Chrome Web Store assets
- **Sharp**: Image processing for icon conversion

## Chrome Extension Specific
- **Chrome APIs**: Storage, alarms, and runtime APIs for extension functionality
- **WebSocket Support**: Real-time communication with web application when connected