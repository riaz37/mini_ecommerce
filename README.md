# Mini E-commerce Platform

A modern, full-stack e-commerce application built with a Turborepo monorepo structure, featuring a Next.js frontend and NestJS backend.

## Overview

This project is a comprehensive e-commerce solution with the following features:

- Product browsing and searching
- Shopping cart functionality
- User authentication and account management
- Order processing and checkout
- Admin dashboard for product and order management
- RESTful API with Swagger documentation

## Tech Stack

### Frontend (apps/web)

- **Next.js 15** with App Router
- **React 19** for UI components
- **Redux Toolkit** for state management
- **Tailwind CSS** for styling
- **Shadcn UI** components

### Backend (apps/server)

- **NestJS** framework
- **Prisma** ORM for database access
- **MySQL** database
- **Redis** for caching and session management
- **Swagger** for API documentation

### Shared Packages

- **@repo/ui**: Shared React component library
- **@repo/eslint-config**: Shared ESLint configurations
- **@repo/typescript-config**: Shared TypeScript configurations

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PNPM 9.0.0
- Docker and Docker Compose (for local development)

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd mini_ecommerce
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start the development environment:

   ```bash
   # Start the database services
   docker-compose up -d

   # Generate Prisma client
   cd apps/server
   pnpm prisma:generate

   # Run database migrations
   pnpm prisma:migrate

   # Seed the database (optional)
   pnpm prisma:seed

   # Return to root directory
   cd ../..

   # Start all applications
   pnpm dev
   ```

## Development

### Running in Development Mode

```bash
pnpm dev
```

This will start all applications in development mode:

- Web frontend: http://localhost:3000
- API server: http://localhost:3001
- API documentation: http://localhost:3001/api

### Building for Production

```bash
pnpm build
```

### Linting

```bash
pnpm lint
```

### Type Checking

```bash
pnpm check-types
```

## Project Structure

```
mini_ecommerce/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/         # Next.js App Router
│   │   │   ├── components/  # React components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── lib/         # Utility functions
│   │   │   └── store/       # Redux store
│   │   └── public/          # Static assets
│   └── server/              # NestJS backend
│       ├── src/
│       │   ├── modules/     # Feature modules
│       │   ├── prisma/      # Database schema and migrations
│       │   └── main.ts      # Application entry point
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── eslint-config/       # Shared ESLint configurations
│   └── typescript-config/   # Shared TypeScript configurations
└── turbo.json               # Turborepo configuration
```

## Features

### Customer Features

- Browse products by category
- Search for products
- View product details and reviews
- Add products to cart
- Manage shopping cart
- Checkout process
- Order history
- Account management

### Admin Features

- Product management
- Category management
- Order management
- Customer management
- Analytics dashboard

## Docker Support

The project includes Docker Compose configuration for local development:

```bash
docker-compose up -d
```

This starts:

- MySQL database on port 3306
- Redis on port 6379

## Deployment

The application is designed to be deployed on Vercel:

```bash
# Deploy the web application
cd apps/web
vercel

# Deploy the API server
cd ../server
vercel
```

## Remote Caching

This Turborepo uses Vercel Remote Caching for faster builds:

```bash
npx turbo login
npx turbo link
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

[MIT License](LICENSE)
