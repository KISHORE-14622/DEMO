pipeline {
    agent any

    environment {
        SFTP_HOST        = 'sftp'
        SFTP_PORT        = '22'
        SFTP_USER        = 'sftpuser'
        SFTP_REMOTE_PATH = 'upload/artifacts'
        BUILD_VERSION    = "${env.BUILD_NUMBER}"
        DOCKER_IMAGE_API = "node-api:${env.BUILD_NUMBER}"
        DOCKER_IMAGE_UI  = "react-app:${env.BUILD_NUMBER}"
        DEPLOY_DIR       = "/tmp/deploy-${env.BUILD_NUMBER}"
    }

    stages {

        // ─── Stage 1: Checkout ──────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo '📥 Checking out source code...'
                checkout scm
                sh 'echo "Branch: $(git rev-parse --abbrev-ref HEAD)"'
                sh 'echo "Commit: $(git rev-parse --short HEAD)"'
            }
        }

        // ─── Stage 2: Install Dependencies ─────────────────────────────
        stage('Install Dependencies') {
            parallel {
                stage('Node API - Install') {
                    steps {
                        dir('node-api') {
                            echo '📦 Installing Node.js API dependencies...'
                            sh 'npm ci || npm install'
                        }
                    }
                }
                stage('React App - Install') {
                    steps {
                        dir('react-app') {
                            echo '📦 Installing React dependencies...'
                            sh 'npm ci || npm install'
                        }
                    }
                }
            }
        }

        // ─── Stage 3: Test ──────────────────────────────────────────────
        stage('Test') {
            parallel {
                stage('Node API - Test') {
                    steps {
                        dir('node-api') {
                            echo '🧪 Running Node.js API tests...'
                            sh 'npm test'
                        }
                    }
                }
                stage('React App - Test') {
                    steps {
                        dir('react-app') {
                            echo '🧪 Running React tests...'
                            sh 'CI=true npm test -- --watchAll=false --passWithNoTests'
                        }
                    }
                }
            }
        }

        // ─── Stage 4: Build ─────────────────────────────────────────────
        stage('Build') {
            parallel {
                stage('Build React Bundle') {
                    steps {
                        dir('react-app') {
                            echo '🔨 Building React production bundle...'
                            sh 'npm run build'
                            sh 'ls -la build/'
                        }
                    }
                }
                stage('Build Docker Images') {
                    steps {
                        echo '🐳 Building Docker images...'
                        sh "docker build -t ${DOCKER_IMAGE_API} ./node-api"
                        sh "docker build -t ${DOCKER_IMAGE_UI} ./react-app"
                        sh "docker images | grep -E 'node-api|react-app'"
                    }
                }
            }
        }

        // ─── Stage 5: Package Artifacts ─────────────────────────────────
        stage('Package Artifacts') {
            steps {
                echo '📦 Packaging build artifacts...'
                sh """
                    mkdir -p ${DEPLOY_DIR}

                    # Package React production build
                    tar -czf ${DEPLOY_DIR}/react-build-${BUILD_VERSION}.tar.gz \
                        -C react-app/build .

                    # Package Node API (exclude node_modules)
                    tar -czf ${DEPLOY_DIR}/node-api-${BUILD_VERSION}.tar.gz \
                        --exclude='node-api/node_modules' \
                        --exclude='node-api/.env' \
                        -C node-api .

                    echo '📋 Artifacts created:'
                    ls -lh ${DEPLOY_DIR}/
                """
            }
        }

        // ─── Stage 6: Upload to SFTP ─────────────────────────────────────
        stage('Upload to SFTP') {
            steps {
                echo '📤 Uploading artifacts to SFTP server...'
                withCredentials([usernamePassword(credentialsId: 'sftp-credentials', usernameVariable: 'SFTP_LOGIN', passwordVariable: 'SFTP_PASS')]) {
                    sh """
                        # Create versioned directory on SFTP and upload files
                        sshpass -p "\$SFTP_PASS" sftp -o StrictHostKeyChecking=no -P ${SFTP_PORT} \${SFTP_LOGIN}@${SFTP_HOST} <<EOF
mkdir ${SFTP_REMOTE_PATH}/build-${BUILD_VERSION}
put ${DEPLOY_DIR}/react-build-${BUILD_VERSION}.tar.gz ${SFTP_REMOTE_PATH}/build-${BUILD_VERSION}/
put ${DEPLOY_DIR}/node-api-${BUILD_VERSION}.tar.gz ${SFTP_REMOTE_PATH}/build-${BUILD_VERSION}/
ls ${SFTP_REMOTE_PATH}/build-${BUILD_VERSION}
EOF
                        echo '✅ SFTP Upload complete!'
                    """
                }
            }
        }

        // ─── Stage 7: Download from SFTP ─────────────────────────────────
        stage('Download from SFTP') {
            steps {
                echo '📥 Downloading artifacts from SFTP server...'
                withCredentials([usernamePassword(credentialsId: 'sftp-credentials', usernameVariable: 'SFTP_LOGIN', passwordVariable: 'SFTP_PASS')]) {
                    sh """
                        mkdir -p ${DEPLOY_DIR}/downloaded

                        # Download artifacts from SFTP to local deploy directory
                        sshpass -p "\$SFTP_PASS" scp -o StrictHostKeyChecking=no \
                            -P ${SFTP_PORT} \
                            \${SFTP_LOGIN}@${SFTP_HOST}:${SFTP_REMOTE_PATH}/build-${BUILD_VERSION}/*.tar.gz \
                            ${DEPLOY_DIR}/downloaded/

                        echo '✅ SFTP Download complete!'
                        ls -lh ${DEPLOY_DIR}/downloaded/
                    """
                }
            }
        }

        // ─── Stage 8: Deploy to Nginx & Containers ───────────────────────
        stage('Deploy') {
            steps {
                echo '🚀 Deploying to Nginx and updating containers...'
                sh """
                    # Extract React build for Nginx
                    mkdir -p ${DEPLOY_DIR}/html
                    tar -xzf ${DEPLOY_DIR}/downloaded/react-build-${BUILD_VERSION}.tar.gz \
                        -C ${DEPLOY_DIR}/html/

                    # Copy built files into the running Nginx container
                    docker cp ${DEPLOY_DIR}/html/. nginx-proxy:/usr/share/nginx/html/

                    # Reload Nginx gracefully (no downtime)
                    docker exec nginx-proxy nginx -s reload
                    echo '✅ Nginx updated and reloaded!'

                    # Update Node.js API container
                    docker stop node-api || true
                    docker rm node-api || true
                    docker run -d \
                        --name node-api \
                        --network demo-jenkins_app-network \
                        -p 5000:5000 \
                        -e NODE_ENV=production \
                        -e BUILD_NUMBER=${BUILD_VERSION} \
                        --restart unless-stopped \
                        ${DOCKER_IMAGE_API}

                    echo '✅ Node API container updated!'
                    docker ps --filter name=node-api
                """
            }
        }

        // ─── Stage 9: Health Check ────────────────────────────────────────
        stage('Health Check') {
            steps {
                echo '🏥 Running post-deployment health checks...'
                sh """
                    # Wait for containers to stabilize
                    sleep 5

                    # Check Node.js API health
                    HTTP_CODE=\$(curl -s -o /dev/null -w "%{http_code}" http://node-api:5000/health)
                    if [ "\$HTTP_CODE" = "200" ]; then
                        echo '✅ Node API is healthy (HTTP 200)'
                    else
                        echo "❌ Node API health check failed! HTTP \$HTTP_CODE"
                        exit 1
                    fi

                    # Check Nginx health
                    HTTP_CODE=\$(curl -s -o /dev/null -w "%{http_code}" http://nginx-proxy/health)
                    if [ "\$HTTP_CODE" = "200" ]; then
                        echo '✅ Nginx is healthy (HTTP 200)'
                    else
                        echo "❌ Nginx health check failed! HTTP \$HTTP_CODE"
                        exit 1
                    fi

                    echo ''
                    echo '═════════════════════════════════════════════'
                    echo '🎉 All health checks passed!'
                    echo '─────────────────────────────────────────────'
                    echo "🌐 React App: http://localhost:80"
                    echo "🟢 Node API:  http://localhost:5000"
                    echo "🔧 Jenkins:   http://localhost:8080"
                    echo '═════════════════════════════════════════════'
                """
            }
        }
    }

    // ─── Post Pipeline ────────────────────────────────────────────────────
    post {
        always {
            echo '🧹 Cleaning up temporary deploy files...'
            sh "rm -rf ${DEPLOY_DIR} || true"
        }
        success {
            echo """
            ╔══════════════════════════════════╗
            ║  ✅  PIPELINE SUCCESS             ║
            ║  Build: #${BUILD_NUMBER}           ║
            ╚══════════════════════════════════╝
            """
        }
        failure {
            echo """
            ╔══════════════════════════════════╗
            ║  ❌  PIPELINE FAILED              ║
            ║  Build: #${BUILD_NUMBER}           ║
            ║  Check the console output above   ║
            ╚══════════════════════════════════╝
            """
        }
    }
}
