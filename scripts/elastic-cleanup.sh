#!/bin/bash

# Environment file name
ENV_FILE=".env.v2"

# Function to stop and remove Elasticsearch containers
cleanup_elasticsearch() {
    echo "Cleaning up Elasticsearch environment..."
    
    # Find the docker-compose.yml file used by start-local
    COMPOSE_FILE=$(find ~/.elastic -name "docker-compose.yml" 2>/dev/null | head -n 1)
    
    if [ -n "$COMPOSE_FILE" ]; then
        echo "Found Elasticsearch compose file at: $COMPOSE_FILE"
        echo "Stopping Elasticsearch services..."
        docker compose -f "$COMPOSE_FILE" down -v
    else
        echo "No Elasticsearch compose file found. Trying alternative methods..."
        
        # Try to stop containers by name pattern
        echo "Stopping Elasticsearch containers..."
        docker ps -a | grep -E "elastic-start-local|elasticsearch|kibana" | awk '{print $1}' | xargs -r docker stop
        docker ps -a | grep -E "elastic-start-local|elasticsearch|kibana" | awk '{print $1}' | xargs -r docker rm
    fi
    
    # Remove the network if it exists
    if docker network ls | grep -q "elastic-start-local_default"; then
        echo "Removing elastic-start-local_default network..."
        docker network rm elastic-start-local_default
    fi
    
    echo "Elasticsearch environment cleaned up."
}

# Function to stop the API
stop_api() {
    echo "Stopping API..."
    docker compose --env-file "$ENV_FILE" down api
}

# Parse command line arguments
ACTION="all"
if [ "$1" == "elasticsearch" ]; then
    ACTION="elasticsearch"
elif [ "$1" == "api" ]; then
    ACTION="api"
elif [ "$1" == "all" ]; then
    ACTION="all"
elif [ "$1" == "help" ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    echo "Usage: $0 [elasticsearch|api|all|help]"
    echo "  elasticsearch - Clean up only Elasticsearch environment"
    echo "  api           - Stop only the API"
    echo "  all           - Clean up everything (default)"
    echo "  help          - Show this help message"
    exit 0
fi

# Execute the requested action
if [ "$ACTION" == "elasticsearch" ] || [ "$ACTION" == "all" ]; then
    cleanup_elasticsearch
fi

if [ "$ACTION" == "api" ] || [ "$ACTION" == "all" ]; then
    stop_api
fi

echo "Cleanup complete!" 