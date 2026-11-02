# Demo Jenkins — React + Node.js + SFTP + Nginx + Docker CI/CD

## 🏗️ Architecture

```
GitHub Push → Jenkins Pipeline → Build → Package
                                    ↓
                               Upload to SFTP
                                    ↓
                           Download from SFTP
                                    ↓
                        Deploy → Nginx + Node.js Containers
```

## 🚀 Quick Start

### 1. Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed

### 2. Start all services
```powershell
docker-compose up -d --build
```

### 3. Verify services
| Service | URL | Credentials |
|---------|-----|-------------|
| React App | http://localhost:3000 | — |
| Nginx (React) | http://localhost:80 | — |
| Node.js API | http://localhost:5000 | — |
| Jenkins | http://localhost:8080 | admin + initial password |
| SFTP | sftp://localhost:2222 | sftpuser / sftppassword |

### 4. Get Jenkins admin password
```powershell
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

## 📁 Project Structure
```
Demo-jenkins/
├── react-app/          # React Hello World frontend
├── node-api/           # Node.js Express API
├── nginx/              # Nginx reverse proxy config
├── sftp/               # SFTP server configuration
├── Jenkinsfile         # CI/CD pipeline definition
└── docker-compose.yml  # Full stack orchestration
```

## 🔧 Jenkins Pipeline Stages
1. **Checkout** — Pull source code
2. **Install Dependencies** — npm ci for both apps
3. **Test** — Run tests for both apps
4. **Build** — React bundle + Docker images
5. **Package Artifacts** — Create .tar.gz archives
6. **Upload to SFTP** — Push artifacts to SFTP server
7. **Download from SFTP** — Pull artifacts back to deploy
8. **Deploy** — Update Nginx + Node.js container
9. **Health Check** — Verify both services respond

## 🛑 Stop Everything
```powershell
docker-compose down        # Stop containers
docker-compose down -v     # Stop + remove volumes
```
