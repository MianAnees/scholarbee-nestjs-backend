#!/bin/bash

# Environment file name
ENV_FILE=".env.v2"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required commands
if ! command_exists docker; then
    echo "Error: docker is not installed"
    exit 1
fi

if ! command_exists docker compose; then
    echo "Error: docker compose is not installed"
    exit 1
fi

# Check if .env.v2 exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE file not found"
    exit 1
fi

# Check if ELASTICSEARCH_PASSWORD is set in .env.v2
if ! grep -q "ELASTICSEARCH_PASSWORD" "$ENV_FILE"; then
    echo "Error: ELASTICSEARCH_PASSWORD not found in $ENV_FILE"
    exit 1
fi

# Function to start Elasticsearch
start_elasticsearch() {
    echo "Starting Elasticsearch..."
    
    # Check if Elasticsearch is already running
    if docker ps | grep -q "elasticsearch"; then
        echo "Elasticsearch is already running"
        return 0
    fi
    
    # Start Elasticsearch using elastic-start-local
    echo "Starting Elasticsearch using elastic-start-local..."
    elastic-start-local
    
    # Wait for Elasticsearch to be ready
    echo "Waiting for Elasticsearch to be ready..."
    sleep 30
    
    # Check if Elasticsearch is running
    if ! docker ps | grep -q "elasticsearch"; then
        echo "Error: Failed to start Elasticsearch"
        exit 1
    fi
    
    echo "Elasticsearch is running"
}

# Function to start the API
start_api() {
    echo "Starting API..."
    
    # Check if API is already running
    if docker ps | grep -q "scholarbee-nestjs-backend-api"; then
        echo "API is already running"
        return 0
    fi
    
    # Start the API
    echo "Starting API..."
    docker compose --env-file "$ENV_FILE" up -d api
    
    # Wait for API to be ready
    echo "Waiting for API to be ready..."
    sleep 10
    
    # Check if API is running
    if ! docker ps | grep -q "scholarbee-nestjs-backend-api"; then
        echo "Error: Failed to start API"
        exit 1
    fi
    
    echo "API is running"
}

# Start Elasticsearch and API
start_elasticsearch
start_api

echo "Setup complete!"
echo "Elasticsearch: http://localhost:9200"
echo "Kibana: http://localhost:5601"
echo "API: http://localhost:3000" 