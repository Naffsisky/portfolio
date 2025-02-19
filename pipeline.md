```
pipeline {
    agent any

    environment {
        REPO_NAME = "portfolio-landing-page"
        IMAGE_NAME = "portfolio-landing-page"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/your-username/your-repo.git'
            }
        }

        stage('Get Current Version') {
            steps {
                script {
                    def lastImage = sh(script: "docker images --format '{{.Tag}}' | grep '^\\d\\+\\.\\d\\+\$' | sort -V | tail -n 1", returnStdout: true).trim()
                    def newVersion = "1.0"

                    if (lastImage) {
                        def parts = lastImage.tokenize('.')
                        def major = parts[0].toInteger()
                        def minor = parts[1].toInteger() + 1
                        newVersion = "${major}.${minor}"
                    }

                    env.NEW_VERSION = newVersion
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${NEW_VERSION} ."
            }
        }

        stage('Deploy') {
            steps {
                sh "docker stop ${IMAGE_NAME} || true"
                sh "docker rm ${IMAGE_NAME} || true"
                sh "docker run -d --name ${IMAGE_NAME} -p 3000:3000 ${IMAGE_NAME}:${NEW_VERSION}"
            }
        }

        stage('Cleanup Old Images') {
            steps {
                script {
                    def images = sh(script: "docker images --format '{{.Repository}}:{{.Tag}}' | grep '^${IMAGE_NAME}:' | sort -V", returnStdout: true).trim().split("\n")

                    if (images.size() > 2) { // Biarkan 2 versi terbaru
                        def imageToRemove = images[0]
                        sh "docker rmi -f ${imageToRemove}"
                    }
                }
            }
        }
    }
}

```
