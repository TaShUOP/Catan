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
                echo 'Building Docker images...'
                sh 'docker build -t catan-server ./server'
                sh 'docker build -t catan-client --build-arg VITE_SERVER_URL=http://localhost:3001 ./client'
            }
        }

        stage('Test Deployment') {
            steps {
                echo 'Testing containers startup...'
                sh 'docker run -d --name catan-server-test -p 3001:3001 catan-server'
                sh 'docker run -d --name catan-client-test -p 5173:5173 catan-client'
                
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
