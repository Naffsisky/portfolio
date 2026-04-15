pipeline {
    agent {
        label 'build-agent'
    }

    environment {
        REGISTRY     = 'ghcr.io'
        IMAGE_NAME   = 'ghcr.io/naffsisky/portfolio'
        CONTAINER_NAME = 'portfolio'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'ghcr-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo $DOCKER_PASS | docker login ghcr.io -u $DOCKER_USER --password-stdin
                        docker push ${IMAGE_NAME}:${BUILD_NUMBER}
                        docker push ${IMAGE_NAME}:latest
                    '''
                }
            }
        }

        stage('Create GHCR Secret') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'ghcr-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        kubectl create secret docker-registry ghcr-secret \
                          --docker-server=ghcr.io \
                          --docker-username=$DOCKER_USER \
                          --docker-password=$DOCKER_PASS \
                          --namespace=portfolio \
                          --dry-run=client -o yaml | kubectl apply -f -
                    '''
                }
            }
        }

        stage('Deploy to k3s') {
            steps {
                sh '''
                    kubectl apply -f /home/ubuntu/k8s/portfolio/deployment.yaml
                    kubectl set image deployment/portfolio \
                      portfolio=${IMAGE_NAME}:${BUILD_NUMBER} \
                      -n portfolio
                    kubectl rollout status deployment/portfolio -n portfolio --timeout=120s
                '''
            }
        }
    }

    post {
        success {
            echo "Portfolio deployed: ${IMAGE_NAME}:${BUILD_NUMBER}"
            sh 'docker image prune -f'
        }
        failure {
            echo 'Pipeline failed!'
            sh 'docker logout ghcr.io || true'
        }
        always {
            sh 'docker logout ghcr.io || true'
        }
    }
}