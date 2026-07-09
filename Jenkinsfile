pipeline {
    agent {
        label 'Main'
    }

    environment {
        SERVER_IMAGE_NAME = "catan-server"
        SERVER_CONTAINER_NAME = "catan-backend"
        
        CLIENT_IMAGE_NAME = "catan-client"
        CLIENT_CONTAINER_NAME = "catan-frontend"

        SERVER_URL = "https://catans.ra9.cloudns.asia"

        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Create Frontend Environment') {
            steps {
                // If you use an .env file for Vite, we can generate it here
                writeFile file: 'client/.env.production', text: """
VITE_SERVER_URL=${SERVER_URL}
"""
            }
        }

        stage('Build Docker Images') {
            steps {
                sh "whoami"
                
                // Build Server Image
                sh """
                    docker build \
                        -t ${SERVER_IMAGE_NAME}:${IMAGE_TAG} \
                        -t ${SERVER_IMAGE_NAME}:latest \
                        ./server
                """

                // Build Client Image
                sh """
                    docker build \
                        --build-arg VITE_SERVER_URL=${SERVER_URL} \
                        -t ${CLIENT_IMAGE_NAME}:${IMAGE_TAG} \
                        -t ${CLIENT_IMAGE_NAME}:latest \
                        ./client
                """
            }
        }

        stage('Stop Existing Containers') {
            steps {
                sh """
                    docker stop ${SERVER_CONTAINER_NAME} || true
                    docker rm ${SERVER_CONTAINER_NAME} || true
                    
                    docker stop ${CLIENT_CONTAINER_NAME} || true
                    docker rm ${CLIENT_CONTAINER_NAME} || true
                """
            }
        }

        stage('Deploy Containers') {
            steps {
                // Run Server Container
                sh """
                    docker run -d \
                        --restart unless-stopped \
                        --name ${SERVER_CONTAINER_NAME} \
                        -p 3001:3001 \
                        ${SERVER_IMAGE_NAME}:latest
                """

                // Run Client Container
                sh """
                    docker run -d \
                        --restart unless-stopped \
                        --name ${CLIENT_CONTAINER_NAME} \
                        -p 5173:5173 \
                        ${CLIENT_IMAGE_NAME}:latest
                """
            }
        }
    }

    post {
        success {
            echo "Deployment Successful!"
            sh "docker ps"
        }

        failure {
            echo "Deployment Failed!"
        }
    }
}
