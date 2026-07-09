pipeline {
    agent any

    environment {
        // You can define environment variables here if needed
        COMPOSE_PROJECT_NAME = "catan-build-${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Build Images') {
            steps {
                echo 'Building Docker images using docker-compose...'
                // Using docker-compose to build the client and server images
                sh 'docker-compose build'
            }
        }

        stage('Test Deployment') {
            steps {
                echo 'Testing containers startup...'
                // Spin up the containers in detached mode
                sh 'docker-compose up -d'
                
                // Wait a few seconds for services to initialize
                sleep time: 10, unit: 'SECONDS'
                
                // You could add curl tests here to verify the endpoints are up, e.g.:
                // sh 'curl -f http://localhost:5173 || exit 1'
                // sh 'curl -f http://localhost:3001 || exit 1'
            }
        }
    }

    post {
        success {
            echo 'Build and test deployment completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Please check the logs.'
        }
    }
}
