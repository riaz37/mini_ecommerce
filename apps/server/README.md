# E-commerce API Server

This is a NestJS-based API server for an e-commerce application. It provides endpoints for managing products, categories, customers, orders, and authentication.

## Description

This server is built with [NestJS](https://github.com/nestjs/nest), a progressive Node.js framework for building efficient and scalable server-side applications. It uses Prisma ORM for database access and includes JWT authentication.

## Project Setup

```bash
# Install dependencies
$ pnpm install

# Generate Prisma client
$ pnpm run prisma:generate

# Run database migrations
$ pnpm run prisma:migrate

# Seed the database with initial data
$ pnpm run prisma:seed
```

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL="mysql://root:password@localhost:3306/ecommerce"
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="1d"
```

## Running the Application

```bash
# Development mode
$ pnpm run dev

# Production mode
$ pnpm run build
$ pnpm run start
```

## API Documentation

Once the application is running, you can access the Swagger API documentation at:

```
http://localhost:3001/api
```

## Database

This application uses MySQL as the database. You can run it using Docker:

```bash
# Start MySQL and Redis containers
$ docker-compose up -d
```

## Available Scripts

```bash
# Run development server with hot-reload
$ pnpm run dev

# Build the application
$ pnpm run build

# Run the built application
$ pnpm run start

# Lint the code
$ pnpm run lint

# Type checking
$ pnpm run check-types

# Generate Prisma client
$ pnpm run prisma:generate

# Run database migrations
$ pnpm run prisma:migrate

# Seed the database
$ pnpm run prisma:seed
```

## Features

- RESTful API endpoints for products, categories, customers, and orders
- JWT authentication
- Role-based access control
- Swagger API documentation
- Database migrations and seeding
- Docker support for development

## Technologies

- NestJS
- Prisma ORM
- MySQL
- Redis
- JWT Authentication
- Swagger
- Docker
