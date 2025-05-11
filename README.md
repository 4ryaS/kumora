# 🚀 Kumora (Builder Platform)

This project enables users to submit a GitHub repository containing a frontend application. The system then:

1. **Spins up a container** on AWS Fargate to clone, install, and build the project.
2. **Streams live logs** to the frontend via **Redis Pub/Sub** and **Socket.IO**.
3. **Uploads the built files** to **Amazon S3**.
4. **Serves the app** via a reverse proxy using subdomain routing.


## 🧩 Technologies Used

- **Fastify** – Web framework
- **AWS ECS Fargate** – For running build jobs
- **Redis (Valkey)** – Pub/Sub for logs
- **Socket.IO** – Real-time log streaming
- **Amazon S3** – For hosting static build outputs
- **Docker** – Containerization
- **http-proxy** – Custom reverse proxy server


## ⚙️ Environment Variables

### API Server (`api-server/.env`)

```env
PORT=9000
SOCKET_PORT=9001
SERVICE_URI=redis://your-valkey-host:6379
ACCESS_KEY=your-aws-access-key
SECRET_KEY=your-aws-secret-key
CLUSTER=your-ecs-cluster-name
TASK=your-ecs-task-definition
SUBNET1=subnet-xxxx
SUBNET2=subnet-xxxx
SUBNET3=subnet-xxxx
SECURITY_GROUP=sg-xxxx
```

### Reverse Proxy Server (`reverse-proxy-server/.env`)

```env
PORT=8000
BASE_PATH=http://s3-bucket-url/__outputs
```


## 🚦 Getting Started

### 1. Build Docker Image for `build-server`

```bash
cd build-server
docker build -t build-server-image .
```

### 2. Start API and Socket.IO Server

```bash
cd api-server
npm install
npm run dev
```

### 3. Start Reverse Proxy Server

```bash
cd reverse-proxy-server
npm install
node server.js
```

## 🖼 Images

![k1](https://github.com/user-attachments/assets/d831dee8-a088-4425-8c08-3a0958c89e05)

![k2](https://github.com/user-attachments/assets/399262b3-db04-493e-8f3c-cfab1ee89c7b)

![k3](https://github.com/user-attachments/assets/81b93c02-4132-4494-9ec6-e142e01d8e17)