# Lineless Lunch

A modern school lunch ordering system.

## Setup

1. Copy `.env.example` to `.env`
2. Add your Supabase credentials to `.env`
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`

## Development

The application supports a demo mode when Supabase credentials are not provided. This allows for development without a backend connection.

## Environment Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Features

- Virtual queue system
- Real-time inventory tracking
- Analytics dashboard
- Student verification
- Dark mode support