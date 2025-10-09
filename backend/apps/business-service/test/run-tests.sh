#!/bin/bash

# Business Service Test Runner
echo "🧪 Running Business Service Tests..."

# Set environment variables for testing
export NODE_ENV=test
export JWT_SECRET=test-secret-key
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=test
export DB_PASSWORD=test
export DB_NAME=mecabal_test

# Run unit tests
echo "📋 Running Unit Tests..."
npm run test:unit

# Run integration tests
echo "🔗 Running Integration Tests..."
npm run test:e2e

# Run all tests with coverage
echo "📊 Running All Tests with Coverage..."
npm run test:cov

echo "✅ All tests completed!"
