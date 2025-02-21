pipeline {
agent any

    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/Naffsisky/portfolio.git', branch: 'main'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t portfolio:${env.BUILD_NUMBER} ."
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    sh 'docker stop portfolio-landing-page || true'
                    sh 'docker rm portfolio-landing-page || true'
                    sh "docker run -d --name portfolio-landing-page --restart=always -p 3000:3000 portfolio:${env.BUILD_NUMBER}"
                }
            }
        }

        stage('Cleanup') {
            steps {
                sh 'docker image prune -a -f'
            }
        }
    }

}
