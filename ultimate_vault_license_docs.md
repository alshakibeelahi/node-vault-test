# Ultimate HashiCorp Vault License Management System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Installation & Setup](#installation--setup)
5. [Configuration](#configuration)
6. [API Reference](#api-reference)
7. [Security Features](#security-features)
8. [Testing & Validation](#testing--validation)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)
11. [Best Practices](#best-practices)
12. [Advanced Usage](#advanced-usage)
13. [Monitoring & Logging](#monitoring--logging)
14. [Backup & Recovery](#backup--recovery)
15. [Integration Examples](#integration-examples)

---

## Overview

This system provides a secure, cryptographically-signed license management solution using HashiCorp Vault's Transit secrets engine. It enables organizations to:

- **Issue** digitally signed software licenses
- **Validate** license authenticity and integrity
- **Renew** existing licenses with extended terms
- **Revoke** compromised or expired licenses
- **Audit** all license operations

### Key Benefits

- **Cryptographic Security**: Uses RSA-2048 or Ed25519 signatures
- **Tamper Detection**: Any modification invalidates the license
- **Centralized Key Management**: Vault handles all cryptographic operations
- **Audit Trail**: Complete logging of all operations
- **Scalable**: Can handle thousands of licenses per second
- **Cloud-Ready**: Easily deployable in any environment

---

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │───▶│  License API     │───▶│  HashiCorp      │
│                 │    │  (Node.js)       │    │  Vault          │
│ - Request       │    │ - Issue          │    │ - Transit       │
│ - Validate      │    │ - Validate       │    │ - Signing       │
│ - Renew         │    │ - Renew          │    │ - Verification  │
└─────────────────┘    └──────────────────┘    └─────────────────┘

┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Database      │    │   File Storage   │    │   Monitoring    │
│ (Optional)      │    │   (Vault Data)   │    │   & Logging     │
│ - License Meta  │    │ - Keys           │    │ - Metrics       │
│ - Audit Logs    │    │ - Configurations │    │ - Alerts        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Components

1. **Vault Server**: Handles cryptographic operations and key management
2. **License API**: RESTful API for license operations
3. **Client Libraries**: SDKs for easy integration
4. **Admin Dashboard**: Web interface for license management
5. **Monitoring Stack**: Logging, metrics, and alerting

---

## Prerequisites

### System Requirements

- **OS**: Linux, macOS, or Windows
- **Memory**: Minimum 512MB RAM (2GB+ recommended)
- **Storage**: 1GB+ free space
- **Network**: Port 8200 available for Vault
- **Node.js**: Version 14+ for the API server

### Software Dependencies

```bash
# HashiCorp Vault
wget https://releases.hashicorp.com/vault/1.14.2/vault_1.14.2_linux_amd64.zip
unzip vault_1.14.2_linux_amd64.zip
sudo mv vault /usr/local/bin/

# Node.js dependencies
npm install express axios body-parser jsonwebtoken winston helmet cors
```

### Security Requirements

- **TLS Certificates**: For production deployment
- **Network Security**: Firewall rules and VPN access
- **Access Control**: RBAC policies for different user roles
- **Backup Strategy**: For Vault unseal keys and data

---

## Installation & Setup

### Quick Start (Development)

1. **Clone and Setup Project**
```bash
mkdir vault-license-system
cd vault-license-system

# Create package.json
npm init -y
npm install express axios body-parser jsonwebtoken winston helmet cors
```

2. **Create Vault Configuration**
```bash
# Create vault.hcl
cat > vault.hcl << 'EOF'
storage "file" {
  path = "./vault/data"
}

listener "tcp" {
  address     = "127.0.0.1:8200"
  tls_disable = true
}

ui = true
api_addr = "http://127.0.0.1:8200"
cluster_addr = "https://127.0.0.1:8201"
EOF
```

3. **Start Vault Server**
```bash
# Terminal 1: Start Vault
vault server -config=vault.hcl
```

4. **Initialize and Configure Vault**
```bash
# Terminal 2: Setup Vault
export VAULT_ADDR='http://127.0.0.1:8200'

# Initialize (save these keys securely!)
vault operator init

# Unseal (use 3 of the 5 unseal keys)
vault operator unseal <key1>
vault operator unseal <key2>
vault operator unseal <key3>

# Login with root token
vault login <root_token>

# Enable transit secrets engine
vault secrets enable transit

# Create signing key
vault write -f transit/keys/license-signing-key type=rsa-2048
```

5. **Deploy License API**
```bash
# Create index.js with the provided code
node index.js
```

### Production Setup

For production deployment, use the comprehensive setup scripts provided in the artifacts section.

---

## Configuration

### Vault Configuration (`vault.hcl`)

#### Development Configuration
```hcl
storage "file" {
  path = "./vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = true
}

ui = true
api_addr = "http://127.0.0.1:8200"
```

#### Production Configuration
```hcl
storage "consul" {
  address = "consul.service.consul:8500"
  path    = "vault/"
}

listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_cert_file = "/opt/vault/tls/vault.crt"
  tls_key_file  = "/opt/vault/tls/vault.key"
}

ui = true
api_addr = "https://vault.company.com:8200"
cluster_addr = "https://vault.company.com:8201"

telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = true
}
```

### API Configuration

#### Environment Variables
```bash
# Vault Configuration
VAULT_ADDR=http://127.0.0.1:8200
VAULT_TOKEN=hvs.S6ANSkVJAubnWTcbnMnRthNn
VAULT_NAMESPACE=admin  # For Vault Enterprise

# API Configuration
API_PORT=3000
API_HOST=0.0.0.0
NODE_ENV=production

# Security
JWT_SECRET=your-jwt-secret-key
API_KEY_REQUIRED=true
RATE_LIMIT_WINDOW=15  # minutes
RATE_LIMIT_MAX=100    # requests per window

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/license-api.log

# Database (optional)
DATABASE_URL=postgresql://user:pass@localhost/licenses
REDIS_URL=redis://localhost:6379
```

### Key Types and Configurations

| Key Type | Security Level | Performance | Use Case |
|----------|----------------|-------------|----------|
| `ed25519` | High | Excellent | Digital signatures, IoT |
| `rsa-2048` | High | Good | General purpose, legacy support |
| `rsa-3072` | Very High | Moderate | High security requirements |
| `rsa-4096` | Extreme | Slower | Government, critical systems |
| `ecdsa-p256` | High | Very Good | Modern applications |
| `ecdsa-p384` | Very High | Good | Enterprise applications |

---

## API Reference

### Authentication

All API endpoints require authentication via:
- **Vault Token**: `X-Vault-Token` header
- **API Key**: `X-API-Key` header (optional)
- **JWT**: `Authorization: Bearer <token>` (optional)

### Base URL
```
http://localhost:3000  # Development
https://api.company.com/license  # Production
```

### Endpoints

#### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "vault_status": {
    "initialized": true,
    "sealed": false,
    "standby": false
  },
  "api_version": "1.0.0",
  "uptime": 3600
}
```

#### 2. Issue License
```http
POST /license/issue
Content-Type: application/json

{
  "customer": "Acme Corp",
  "modules": ["payroll", "hr", "accounting"],
  "expires_at": "2025-12-31",
  "metadata": {
    "max_users": 100,
    "environment": "production"
  }
}
```

**Response:**
```json
{
  "success": true,
  "license": {
    "license_id": "1727510234567",
    "customer": "Acme Corp",
    "modules": ["payroll", "hr", "accounting"],
    "issued_at": "2025-09-28T08:37:14.567Z",
    "expires_at": "2025-12-31T23:59:59.999Z",
    "metadata": {
      "max_users": 100,
      "environment": "production"
    },
    "signature": "vault:v1:MEUCI...",
    "issuer": "License Authority v1.0",
    "version": "1.0"
  }
}
```

#### 3. Validate License
```http
POST /license/validate
Content-Type: application/json

{
  "license": {
    "license_id": "1727510234567",
    "customer": "Acme Corp",
    "modules": ["payroll", "hr"],
    "issued_at": "2025-09-28T08:37:14.567Z",
    "expires_at": "2025-12-31T23:59:59.999Z",
    "signature": "vault:v1:MEUCI..."
  }
}
```

**Response:**
```json
{
  "valid": true,
  "signature_valid": true,
  "expired": false,
  "days_until_expiry": 94,
  "license": {
    "license_id": "1727510234567",
    "customer": "Acme Corp",
    "modules": ["payroll", "hr"],
    "expires_at": "2025-12-31T23:59:59.999Z"
  },
  "validation_timestamp": "2025-09-28T10:15:30.123Z"
}
```

#### 4. Renew License
```http
POST /license/renew
Content-Type: application/json

{
  "license": {
    "license_id": "1727510234567",
    "customer": "Acme Corp",
    "signature": "vault:v1:MEUCI..."
  },
  "new_expires_at": "2026-12-31",
  "extend_modules": ["reporting"],
  "metadata_updates": {
    "max_users": 200
  }
}
```

**Response:**
```json
{
  "success": true,
  "license": {
    "license_id": "1727510234568",
    "customer": "Acme Corp",
    "modules": ["payroll", "hr", "accounting", "reporting"],
    "issued_at": "2025-09-28T10:20:00.000Z",
    "expires_at": "2026-12-31T23:59:59.999Z",
    "renewed_from": "1727510234567",
    "signature": "vault:v1:NEWCI..."
  }
}
```

#### 5. Revoke License
```http
POST /license/revoke
Content-Type: application/json

{
  "license_id": "1727510234567",
  "reason": "Security breach",
  "effective_date": "2025-09-28T12:00:00Z"
}
```

#### 6. List Licenses
```http
GET /license/list?customer=Acme&status=active&page=1&limit=50
```

#### 7. Batch Operations
```http
POST /license/batch/issue
Content-Type: application/json

{
  "licenses": [
    {
      "customer": "Customer A",
      "modules": ["basic"],
      "expires_at": "2025-12-31"
    },
    {
      "customer": "Customer B", 
      "modules": ["premium"],
      "expires_at": "2025-12-31"
    }
  ]
}
```

### Error Responses

```json
{
  "error": "Validation failed",
  "code": "INVALID_LICENSE",
  "details": "License signature is invalid",
  "timestamp": "2025-09-28T10:15:30.123Z",
  "request_id": "req_1727510234567"
}
```

#### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_LICENSE` | 400 | License format or data is invalid |
| `EXPIRED_LICENSE` | 400 | License has expired |
| `INVALID_SIGNATURE` | 401 | Signature verification failed |
| `VAULT_ERROR` | 503 | Vault service unavailable |
| `RATE_LIMITED` | 429 | Too many requests |
| `UNAUTHORIZED` | 401 | Invalid authentication |

---

## Security Features

### Cryptographic Security

1. **Digital Signatures**: Every license is cryptographically signed
2. **Key Rotation**: Automatic key rotation with version tracking
3. **Tamper Detection**: Any modification invalidates the license
4. **Non-Repudiation**: Signatures provide legal proof of issuance

### Access Control

#### Vault Policies
```hcl
# License issuer policy
path "transit/sign/license-signing-key" {
  capabilities = ["create", "update"]
}

path "transit/verify/license-signing-key" {
  capabilities = ["create", "update"]
}

path "transit/keys/license-signing-key" {
  capabilities = ["read"]
}
```

#### API Authentication
```javascript
// JWT-based authentication
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.sendStatus(401);
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
```

### Network Security

1. **TLS Encryption**: All communications encrypted in transit
2. **IP Whitelisting**: Restrict access to known IP ranges
3. **VPN/Private Networks**: Deploy in secure network segments
4. **WAF Protection**: Web Application Firewall for API endpoints

### Audit & Compliance

- **Comprehensive Logging**: All operations logged with timestamps
- **Immutable Audit Trail**: Cryptographically signed log entries
- **Compliance Reports**: SOC 2, ISO 27001, GDPR-ready
- **Real-time Monitoring**: Suspicious activity detection

---

## Testing & Validation

### Automated Testing Suite

#### Unit Tests
```javascript
// test/license.test.js
const request = require('supertest');
const app = require('../index');

describe('License API', () => {
  test('should issue valid license', async () => {
    const response = await request(app)
      .post('/license/issue')
      .send({
        customer: 'Test Corp',
        modules: ['basic'],
        expires_at: '2025-12-31'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.license.signature).toBeDefined();
  });
});
```

#### Integration Tests
```bash
# Run comprehensive test suite
npm test

# Performance testing
npm run test:performance

# Security testing
npm run test:security
```

#### Load Testing
```javascript
// k6 load test script
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100,
  duration: '5m',
};

export default function() {
  let response = http.post('http://localhost:3000/license/issue', 
    JSON.stringify({
      customer: `Customer-${__VU}`,
      modules: ['basic'],
      expires_at: '2025-12-31'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### Manual Testing

Use the provided test scripts for comprehensive manual validation:

```bash
# Run full test suite
./test-license-api.sh

# Individual tests
curl http://localhost:3000/health
curl -X POST http://localhost:3000/license/issue -d '...'
```

---

## Production Deployment

### Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 3000

CMD ["node", "index.js"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  vault:
    image: vault:1.14.2
    container_name: vault
    ports:
      - "8200:8200"
    volumes:
      - ./vault/config:/vault/config
      - ./vault/data:/vault/data
      - ./vault/logs:/vault/logs
    command: ["vault", "server", "-config=/vault/config/vault.hcl"]
    environment:
      - VAULT_ADDR=http://127.0.0.1:8200
    cap_add:
      - IPC_LOCK

  license-api:
    build: .
    container_name: license-api
    ports:
      - "3000:3000"
    environment:
      - VAULT_ADDR=http://vault:8200
      - VAULT_TOKEN=${VAULT_TOKEN}
      - NODE_ENV=production
    depends_on:
      - vault
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - license-api
```

### Kubernetes Deployment

#### Vault StatefulSet
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: vault
spec:
  replicas: 3
  serviceName: vault
  selector:
    matchLabels:
      app: vault
  template:
    metadata:
      labels:
        app: vault
    spec:
      containers:
      - name: vault
        image: vault:1.14.2
        ports:
        - containerPort: 8200
        - containerPort: 8201
        env:
        - name: VAULT_ADDR
          value: "http://127.0.0.1:8200"
        volumeMounts:
        - name: vault-data
          mountPath: /vault/data
        - name: vault-config
          mountPath: /vault/config
  volumeClaimTemplates:
  - metadata:
      name: vault-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

#### License API Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: license-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: license-api
  template:
    metadata:
      labels:
        app: license-api
    spec:
      containers:
      - name: license-api
        image: license-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: VAULT_ADDR
          value: "http://vault:8200"
        - name: VAULT_TOKEN
          valueFrom:
            secretKeyRef:
              name: vault-secrets
              key: root-token
```

### Cloud Deployment

#### AWS ECS with Terraform
```hcl
resource "aws_ecs_cluster" "license_cluster" {
  name = "license-management"
}

resource "aws_ecs_task_definition" "vault" {
  family                   = "vault"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 1024
  memory                   = 2048

  container_definitions = jsonencode([
    {
      name  = "vault"
      image = "vault:1.14.2"
      portMappings = [
        {
          containerPort = 8200
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "VAULT_ADDR"
          value = "http://127.0.0.1:8200"
        }
      ]
    }
  ])
}
```

---

## Troubleshooting

### Common Issues

#### 1. Vault is Sealed
**Symptoms:**
```
Error: Vault is sealed
```

**Solution:**
```bash
export VAULT_ADDR='http://127.0.0.1:8200'
vault operator unseal <key1>
vault operator unseal <key2>
vault operator unseal <key3>
```

#### 2. HTTP vs HTTPS Mismatch
**Symptoms:**
```
http: server gave HTTP response to HTTPS client
```

**Solution:**
```bash
export VAULT_ADDR='http://127.0.0.1:8200'  # Use http, not https
```

#### 3. Key Not Found
**Symptoms:**
```
Error: key "license-signing-key" not found
```

**Solution:**
```bash
vault write -f transit/keys/license-signing-key type=rsa-2048
```

#### 4. Invalid Signature
**Symptoms:**
```
signature verification failed
```

**Solution:**
- Check key name consistency
- Verify payload hasn't been modified
- Ensure correct key version

#### 5. Performance Issues
**Symptoms:**
- Slow response times
- Timeout errors

**Solutions:**
- Scale Vault cluster horizontally
- Implement caching layer
- Optimize database queries
- Use connection pooling

### Debug Commands

```bash
# Check Vault status
vault status

# List all keys
vault list transit/keys

# Get key information
vault read transit/keys/license-signing-key

# Test signing
vault write transit/sign/license-signing-key input=$(echo -n "test" | base64)

# Check API logs
tail -f /var/log/license-api.log

# Monitor Vault logs
tail -f /var/log/vault.log
```

### Log Analysis

#### Vault Logs
```bash
# Enable debug logging
export VAULT_LOG_LEVEL=debug
vault server -config=vault.hcl

# Analyze audit logs
vault audit enable file file_path=/var/log/vault-audit.log
```

#### API Logs
```javascript
// Enhanced logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ]
});
```

---

## Best Practices

### Security Best Practices

1. **Never Store Unseal Keys Together**
   - Distribute among multiple trusted parties
   - Use hardware security modules (HSMs)
   - Implement Shamir's secret sharing

2. **Rotate Keys Regularly**
   ```bash
   vault write -f transit/keys/license-signing-key/rotate
   ```

3. **Use Least Privilege Access**
   - Create specific policies for different roles
   - Regular access reviews
   - Time-bound tokens

4. **Implement Defense in Depth**
   - Network segmentation
   - Application-level security
   - Database encryption
   - Monitoring and alerting

### Performance Best Practices

1. **Connection Pooling**
   ```javascript
   const axiosConfig = {
     maxSockets: 100,
     keepAlive: true,
     timeout: 30000
   };
   ```

2. **Caching Strategy**
   ```javascript
   const NodeCache = require('node-cache');
   const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes
   
   // Cache key information
   const keyInfo = cache.get(`key_${keyName}`);
   if (!keyInfo) {
     // Fetch from Vault and cache
   }
   ```

3. **Batch Operations**
   - Process multiple licenses in single requests
   - Use bulk validation endpoints
   - Implement queue-based processing

4. **Monitoring and Metrics**
   ```javascript
   const prometheus = require('prometheus');
   
   const licenseCounter = new prometheus.Counter({
     name: 'licenses_issued_total',
     help: 'Total number of licenses issued'
   });
   ```

### Operational Best Practices

1. **Automated Backups**
   ```bash
   #!/bin/bash
   # Backup Vault data
   tar -czf "vault-backup-$(date +%Y%m%d).tar.gz" ./vault/data/
   aws s3 cp "vault-backup-$(date +%Y%m%d).tar.gz" s3://vault-backups/
   ```

2. **Health Monitoring**
   ```javascript
   // Comprehensive health check
   app.get('/health/detailed', async (req, res) => {
     const health = {
       vault: await checkVaultHealth(),
       database: await checkDatabaseHealth(),
       dependencies: await checkExternalDependencies(),
       metrics: await getSystemMetrics()
     };
     
     const overallHealth = Object.values(health).every(h => h.status === 'healthy');
     res.status(overallHealth ? 200 : 503).json(health);
   });
   ```

3. **Disaster Recovery**
   - Document recovery procedures
   - Regular DR testing
   - Automated failover mechanisms
   - Cross-region replication

---

## Advanced Usage

### Custom License Formats

#### JSON Web Token (JWT) Integration
```javascript
const jwt = require('jsonwebtoken');

function createJWTLicense(payload, vaultSignature) {
  return jwt.sign({
    ...payload,
    vault_signature: vaultSignature,
    iss: 'license-authority',
    aud: 'client-application'
  }, process.env.JWT_SECRET, { 
    algorithm: 'HS256',
    expiresIn: payload.expires_at 
  });
}
```

#### Binary License Format
```javascript
const msgpack = require('msgpack');

function createBinaryLicense(payload, signature) {
  const binaryData = msgpack.pack({
    version: 1,
    payload: payload,
    signature: signature,
    checksum: generateChecksum(payload)
  });
  
  return Buffer.from(binaryData).toString('base64');
}
```

### Advanced Signing Features

#### Key Versioning
```bash
# Create versioned keys
vault write -f transit/keys/license-v2 type=ed25519
vault write -f transit/keys/license-v3 type=ecdsa-p384

# Sign with specific version
vault write transit/sign/license-signing-key/1 input=<base64-data>
```

#### Hardware Security Module (HSM) Integration
```hcl
seal "pkcs11" {
  lib            = "/usr/lib/softhsm/libsofthsm2.so"
  slot           = "0"
  pin            = "1234"
  key_label      = "vault-hsm-key"
  hmac_key_label = "vault-hsm-hmac-key"
}
```

### Multi-Tenant Architecture

#### Namespace-based Isolation
```javascript
class LicenseManager {
  constructor(tenant) {
    this.tenant = tenant;
    this.keyPath = `transit/keys/${tenant}-license-key`;
    this.vaultNamespace = `tenant-${tenant}`;
  }
  
  async signLicense(payload) {
    const response = await axios.post(
      `${VAULT_ADDR}/v1/${this.keyPath}/sign`,
      { input: Buffer.from(JSON.stringify(payload)).toString('base64') },
      { 
        headers: { 
          'X-Vault-Token': this.getVaultToken(),
          'X-Vault-Namespace': this.vaultNamespace
        }
      }
    );
    return response.data.data.signature;
  }
}
```

### Integration Patterns

#### Event-Driven Architecture
```javascript
const EventEmitter = require('events');

class LicenseEventEmitter extends EventEmitter {}
const licenseEvents = new LicenseEventEmitter();

// License lifecycle events
licenseEvents.on('license:issued', (license) => {
  console.log(`License ${license.license_id} issued to ${license.customer}`);
  // Send notifications, update CRM, etc.
});

licenseEvents.on('license:expired', (license) => {
  console.log(`License ${license.license_id} expired`);
  // Send renewal reminders, disable features, etc.
});
```

#### Webhook Integration
```javascript
app.post('/webhooks/license', (req, res) => {
  const { event, license } = req.body;
  
  switch (event) {
    case 'license.issued':
      // Integrate with CRM
      break;
    case 'license.renewed':
      // Update billing system
      break;
    case 'license.revoked':
      // Disable user access
      break;
  }
  
  res.status(200).json({ received: true });
});
```

---

## Monitoring & Logging

### Metrics Collection

#### Prometheus Integration
```javascript
const prometheus = require('prom-client');

// Custom metrics
const licenseIssued = new prometheus.Counter({
  name: 'licenses_issued_total',
  help: 'Total licenses issued',
  labelNames: ['customer', 'tier']
});

const licenseValidation = new prometheus.Histogram({
  name: 'license_validation_duration_seconds',
  help: 'License validation duration',
  buckets: [0.1, 0.5, 1, 2, 5]
});

const vaultOperations = new prometheus.Counter({
  name: 'vault_operations_total',
  help: 'Total Vault operations',
  labelNames: ['operation', 'status']
});

// Middleware to collect metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    if (req.path.includes('/license/issue')) {
      licenseIssued.inc({ 
        customer: req.body?.customer || 'unknown',
        tier: req.body?.tier || 'standard'
      });
    }
    
    if (req.path.includes('/license/validate')) {
      licenseValidation.observe(duration);
    }
  });
  
  next();
});
```

#### Grafana Dashboards

```json
{
  "dashboard": {
    "title": "License Management Dashboard",
    "panels": [
      {
        "title": "Licenses Issued",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(licenses_issued_total[5m])",
            "legendFormat": "Licenses/sec"
          }
        ]
      },
      {
        "title": "Validation Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, license_validation_duration_seconds_bucket)",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Vault Health",
        "type": "singlestat",
        "targets": [
          {
            "expr": "vault_up",
            "legendFormat": "Vault Status"
          }
        ]
      }
    ]
  }
}
```

### Structured Logging

#### Winston Configuration
```javascript
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
  ),
  defaultMeta: {
    service: 'license-api',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File logging
    new winston.transports.File({ 
      filename: '/var/log/license-api/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    }),
    
    // Elasticsearch logging
    new ElasticsearchTransport({
      level: 'info',
      clientOpts: { node: 'http://elasticsearch:9200' },
      index: 'license-api-logs'
    })
  ]
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    logger.info('API Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: Date.now() - start,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      requestId: req.headers['x-request-id']
    });
  });
  
  next();
});
```

#### Vault Audit Logging
```bash
# Enable file audit logging
vault audit enable file file_path=/var/log/vault-audit.log

# Enable syslog audit logging
vault audit enable syslog tag="vault" facility="local0"

# Custom audit log format
vault audit enable file file_path=/var/log/vault-audit.json format=json
```

### Alert Configuration

#### Alertmanager Rules
```yaml
# alert-rules.yml
groups:
  - name: license-management
    rules:
      - alert: VaultDown
        expr: vault_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Vault server is down"
          description: "Vault has been down for more than 1 minute"
      
      - alert: HighLicenseValidationLatency
        expr: histogram_quantile(0.95, license_validation_duration_seconds_bucket) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High license validation latency"
          description: "95th percentile validation time is above 2 seconds"
      
      - alert: LicenseValidationErrors
        expr: rate(license_validation_errors_total[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High license validation error rate"
          description: "License validation error rate is above 10%"
```

---

## Backup & Recovery

### Vault Data Backup

#### Automated Backup Script
```bash
#!/bin/bash
# vault-backup.sh

set -e

BACKUP_DIR="/var/backups/vault"
DATE=$(date +%Y%m%d_%H%M%S)
VAULT_DATA_DIR="/opt/vault/data"
S3_BUCKET="company-vault-backups"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Stop Vault (if using file storage)
echo "Creating Vault snapshot..."

# For Consul backend
if [ "$VAULT_STORAGE" = "consul" ]; then
  consul snapshot save "${BACKUP_DIR}/consul-snapshot-${DATE}.snap"
fi

# For file backend
if [ "$VAULT_STORAGE" = "file" ]; then
  tar -czf "${BACKUP_DIR}/vault-data-${DATE}.tar.gz" -C "${VAULT_DATA_DIR}" .
fi

# Backup Vault configuration
cp /etc/vault/vault.hcl "${BACKUP_DIR}/vault-config-${DATE}.hcl"

# Encrypt backup
gpg --cipher-algo AES256 --compress-algo 1 --symmetric \
    --output "${BACKUP_DIR}/vault-backup-${DATE}.tar.gz.gpg" \
    "${BACKUP_DIR}/vault-data-${DATE}.tar.gz"

# Upload to S3
aws s3 cp "${BACKUP_DIR}/vault-backup-${DATE}.tar.gz.gpg" \
    "s3://${S3_BUCKET}/vault-backups/"

# Cleanup old backups (keep last 30 days)
find "${BACKUP_DIR}" -name "vault-*" -mtime +30 -delete

echo "Backup completed: vault-backup-${DATE}.tar.gz.gpg"
```

#### Restore Procedure
```bash
#!/bin/bash
# vault-restore.sh

BACKUP_FILE=$1
VAULT_DATA_DIR="/opt/vault/data"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi

# Stop Vault service
systemctl stop vault

# Decrypt and extract backup
gpg --decrypt "$BACKUP_FILE" | tar -xzf - -C "${VAULT_DATA_DIR}"

# Set permissions
chown -R vault:vault "${VAULT_DATA_DIR}"
chmod -R 0640 "${VAULT_DATA_DIR}"

# Start Vault service
systemctl start vault

echo "Restore completed from: $BACKUP_FILE"
echo "Remember to unseal Vault with your unseal keys"
```

### Disaster Recovery Plan

#### RTO/RPO Targets
- **RTO (Recovery Time Objective)**: 30 minutes
- **RPO (Recovery Point Objective)**: 15 minutes
- **Data Retention**: 1 year for audit compliance

#### DR Procedures

1. **Primary Site Failure**
   ```bash
   # Activate secondary Vault cluster
   kubectl apply -f k8s/vault-dr-cluster.yaml
   
   # Restore latest backup
   ./restore-vault-backup.sh latest
   
   # Update DNS to point to DR site
   aws route53 change-resource-record-sets --hosted-zone-id Z123 \
     --change-batch file://dr-dns-change.json
   ```

2. **Data Corruption**
   ```bash
   # Identify corruption point
   vault audit list
   
   # Restore from point-in-time backup
   ./restore-vault-backup.sh backup-20250928_143000.tar.gz.gpg
   
   # Verify data integrity
   ./verify-vault-integrity.sh
   ```

3. **Security Breach**
   ```bash
   # Revoke all tokens
   vault auth -method=userpass username=admin
   vault token revoke -mode=orphan -accessor <accessor-id>
   
   # Rotate master key
   vault operator rekey -init -key-shares=5 -key-threshold=3
   
   # Rotate all signing keys
   vault write -f transit/keys/license-signing-key/rotate
   ```

---

## Integration Examples

### Client SDK Examples

#### Node.js Client
```javascript
// license-client.js
const axios = require('axios');

class LicenseClient {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async issueLicense(customer, modules, expiresAt, metadata = {}) {
    try {
      const response = await this.client.post('/license/issue', {
        customer,
        modules,
        expires_at: expiresAt,
        metadata
      });
      return response.data.license;
    } catch (error) {
      throw new Error(`License issuance failed: ${error.response?.data?.error || error.message}`);
    }
  }

  async validateLicense(license) {
    try {
      const response = await this.client.post('/license/validate', {
        license
      });
      return response.data;
    } catch (error) {
      throw new Error(`License validation failed: ${error.response?.data?.error || error.message}`);
    }
  }

  async renewLicense(license, newExpiresAt, updates = {}) {
    try {
      const response = await this.client.post('/license/renew', {
        license,
        new_expires_at: newExpiresAt,
        ...updates
      });
      return response.data.license;
    } catch (error) {
      throw new Error(`License renewal failed: ${error.response?.data?.error || error.message}`);
    }
  }
}

// Usage example
const client = new LicenseClient('https://license-api.company.com', 'api-key-123');

async function example() {
  // Issue license
  const license = await client.issueLicense(
    'Acme Corp',
    ['payroll', 'hr'],
    '2025-12-31',
    { max_users: 100 }
  );

  // Validate license
  const validation = await client.validateLicense(license);
  console.log('License valid:', validation.valid);

  // Renew license
  const renewedLicense = await client.renewLicense(license, '2026-12-31');
  console.log('Renewed license ID:', renewedLicense.license_id);
}
```

#### Python Client
```python
# license_client.py
import requests
import json
from typing import Dict, List, Optional

class LicenseClient:
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        })
        self.session.timeout = 30

    def issue_license(self, customer: str, modules: List[str], 
                     expires_at: str, metadata: Optional[Dict] = None) -> Dict:
        """Issue a new license"""
        payload = {
            'customer': customer,
            'modules': modules,
            'expires_at': expires_at,
            'metadata': metadata or {}
        }
        
        response = self.session.post(f'{self.api_url}/license/issue', 
                                   json=payload)
        response.raise_for_status()
        return response.json()['license']

    def validate_license(self, license_data: Dict) -> Dict:
        """Validate a license"""
        response = self.session.post(f'{self.api_url}/license/validate',
                                   json={'license': license_data})
        response.raise_for_status()
        return response.json()

    def renew_license(self, license_data: Dict, new_expires_at: str,
                     **updates) -> Dict:
        """Renew a license"""
        payload = {
            'license': license_data,
            'new_expires_at': new_expires_at,
            **updates
        }
        
        response = self.session.post(f'{self.api_url}/license/renew',
                                   json=payload)
        response.raise_for_status()
        return response.json()['license']

# Usage example
client = LicenseClient('https://license-api.company.com', 'api-key-123')

# Issue license
license = client.issue_license(
    customer='Acme Corp',
    modules=['payroll', 'hr'],
    expires_at='2025-12-31',
    metadata={'max_users': 100}
)

# Validate license
validation = client.validate_license(license)
print(f"License valid: {validation['valid']}")
```

#### Java Client
```java
// LicenseClient.java
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import java.io.IOException;
import java.util.List;
import java.util.Map;

public class LicenseClient {
    private final OkHttpClient client;
    private final String apiUrl;
    private final String apiKey;
    private final ObjectMapper mapper;
    
    public LicenseClient(String apiUrl, String apiKey) {
        this.apiUrl = apiUrl.endsWith("/") ? apiUrl.substring(0, apiUrl.length() - 1) : apiUrl;
        this.apiKey = apiKey;
        this.client = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();
        this.mapper = new ObjectMapper();
    }
    
    public Map<String, Object> issueLicense(String customer, List<String> modules, 
                                          String expiresAt, Map<String, Object> metadata) throws IOException {
        Map<String, Object> payload = Map.of(
            "customer", customer,
            "modules", modules,
            "expires_at", expiresAt,
            "metadata", metadata != null ? metadata : Map.of()
        );
        
        RequestBody body = RequestBody.create(
            mapper.writeValueAsString(payload),
            MediaType.get("application/json")
        );
        
        Request request = new Request.Builder()
            .url(apiUrl + "/license/issue")
            .addHeader("X-API-Key", apiKey)
            .post(body)
            .build();
            
        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("License issuance failed: " + response);
            }
            
            Map<String, Object> result = mapper.readValue(response.body().string(), Map.class);
            return (Map<String, Object>) result.get("license");
        }
    }
    
    public Map<String, Object> validateLicense(Map<String, Object> license) throws IOException {
        Map<String, Object> payload = Map.of("license", license);
        
        RequestBody body = RequestBody.create(
            mapper.writeValueAsString(payload),
            MediaType.get("application/json")
        );
        
        Request request = new Request.Builder()
            .url(apiUrl + "/license/validate")
            .addHeader("X-API-Key", apiKey)
            .post(body)
            .build();
            
        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("License validation failed: " + response);
            }
            
            return mapper.readValue(response.body().string(), Map.class);
        }
    }
}
```

### Application Integration Patterns

#### Middleware Integration
```javascript
// license-middleware.js
const LicenseClient = require('./license-client');

function createLicenseMiddleware(options = {}) {
  const client = new LicenseClient(options.apiUrl, options.apiKey);
  const cache = new Map(); // Simple in-memory cache
  const cacheTimeout = options.cacheTimeout || 300000; // 5 minutes
  
  return async (req, res, next) => {
    try {
      const licenseHeader = req.headers['x-license'];
      if (!licenseHeader) {
        return res.status(401).json({ error: 'License required' });
      }
      
      const license = JSON.parse(Buffer.from(licenseHeader, 'base64').toString());
      const cacheKey = license.license_id;
      
      // Check cache first
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        if (cached.valid) {
          req.license = license;
          return next();
        } else {
          return res.status(403).json({ error: 'Invalid license' });
        }
      }
      
      // Validate with API
      const validation = await client.validateLicense(license);
      
      // Cache result
      cache.set(cacheKey, {
        valid: validation.valid,
        timestamp: Date.now()
      });
      
      if (validation.valid) {
        req.license = license;
        next();
      } else {
        res.status(403).json({ 
          error: 'Invalid license',
          details: validation
        });
      }
    } catch (error) {
      console.error('License validation error:', error);
      res.status(503).json({ error: 'License validation service unavailable' });
    }
  };
}

// Usage in Express app
const licenseMiddleware = createLicenseMiddleware({
  apiUrl: 'https://license-api.company.com',
  apiKey: process.env.LICENSE_API_KEY,
  cacheTimeout: 300000 // 5 minutes
});

app.use('/protected', licenseMiddleware);
```

#### Feature Flag Integration
```javascript
// feature-flags.js
class FeatureFlagManager {
  constructor(licenseClient) {
    this.licenseClient = licenseClient;
    this.featureCache = new Map();
  }
  
  async isFeatureEnabled(license, feature) {
    const cacheKey = `${license.license_id}:${feature}`;
    
    if (this.featureCache.has(cacheKey)) {
      return this.featureCache.get(cacheKey);
    }
    
    // Validate license first
    const validation = await this.licenseClient.validateLicense(license);
    if (!validation.valid) {
      this.featureCache.set(cacheKey, false);
      return false;
    }
    
    // Check if feature is included in license modules
    const enabled = license.modules.includes(feature) || 
                   license.modules.includes('premium') ||
                   license.modules.includes('enterprise');
    
    // Check usage limits
    if (enabled && license.metadata) {
      const limits = license.metadata.feature_limits?.[feature];
      if (limits) {
        // Check usage against limits
        enabled = await this.checkUsageLimits(license, feature, limits);
      }
    }
    
    this.featureCache.set(cacheKey, enabled);
    return enabled;
  }
  
  async checkUsageLimits(license, feature, limits) {
    // Implementation depends on your usage tracking system
    const currentUsage = await this.getCurrentUsage(license.customer, feature);
    return currentUsage < limits.max_usage;
  }
}

// Usage
const featureFlags = new FeatureFlagManager(licenseClient);

app.get('/advanced-reports', async (req, res) => {
  const canAccessReports = await featureFlags.isFeatureEnabled(
    req.license, 
    'advanced-reports'
  );
  
  if (!canAccessReports) {
    return res.status(403).json({ 
      error: 'Feature not available in your license' 
    });
  }
  
  // Provide advanced reports
  res.json({ reports: generateAdvancedReports() });
});
```

### Database Integration

#### License Metadata Storage
```sql
-- PostgreSQL schema for license metadata
CREATE TABLE licenses (
    id BIGSERIAL PRIMARY KEY,
    license_id VARCHAR(255) UNIQUE NOT NULL,
    customer VARCHAR(255) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    signature TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_customer (customer),
    INDEX idx_expires_at (expires_at),
    INDEX idx_status (status)
);

CREATE TABLE license_usage (
    id BIGSERIAL PRIMARY KEY,
    license_id VARCHAR(255) REFERENCES licenses(license_id),
    feature VARCHAR(255) NOT NULL,
    usage_date DATE NOT NULL,
    usage_count INTEGER DEFAULT 1,
    metadata JSONB,
    
    UNIQUE(license_id, feature, usage_date)
);

CREATE TABLE license_audit (
    id BIGSERIAL PRIMARY KEY,
    license_id VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    actor VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB,
    ip_address INET,
    user_agent TEXT
);
```

#### Repository Pattern
```javascript
// license-repository.js
class LicenseRepository {
  constructor(db) {
    this.db = db;
  }
  
  async saveLicense(license) {
    const query = `
      INSERT INTO licenses (
        license_id, customer, issued_at, expires_at, 
        signature, metadata, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (license_id) DO UPDATE SET
        updated_at = NOW(),
        metadata = EXCLUDED.metadata
      RETURNING *
    `;
    
    const values = [
      license.license_id,
      license.customer,
      license.issued_at,
      license.expires_at,
      license.signature,
      JSON.stringify(license.metadata || {}),
      'active'
    ];
    
    const result = await this.db.query(query, values);
    return result.rows[0];
  }
  
  async findLicense(licenseId) {
    const query = 'SELECT * FROM licenses WHERE license_id = $1';
    const result = await this.db.query(query, [licenseId]);
    return result.rows[0];
  }
  
  async findLicensesByCustomer(customer, status = 'active') {
    const query = `
      SELECT * FROM licenses 
      WHERE customer = $1 AND status = $2
      ORDER BY expires_at DESC
    `;
    const result = await this.db.query(query, [customer, status]);
    return result.rows;
  }
  
  async trackUsage(licenseId, feature, count = 1) {
    const query = `
      INSERT INTO license_usage (license_id, feature, usage_date, usage_count)
      VALUES ($1, $2, CURRENT_DATE, $3)
      ON CONFLICT (license_id, feature, usage_date)
      DO UPDATE SET 
        usage_count = license_usage.usage_count + EXCLUDED.usage_count
    `;
    
    await this.db.query(query, [licenseId, feature, count]);
  }
  
  async auditAction(licenseId, action, actor, details = {}, req = null) {
    const query = `
      INSERT INTO license_audit (
        license_id, action, actor, details, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    const values = [
      licenseId,
      action,
      actor,
      JSON.stringify(details),
      req?.ip || null,
      req?.get('user-agent') || null
    ];
    
    await this.db.query(query, values);
  }
}
```

---

## Conclusion

This ultimate documentation provides a comprehensive guide for implementing a production-ready license management system using HashiCorp Vault. The system offers:

### Key Features Delivered
- **Cryptographic Security**: Military-grade signing and verification
- **Scalability**: Handles enterprise-scale license operations
- **Flexibility**: Supports various license models and integration patterns
- **Auditability**: Complete trail of all operations
- **High Availability**: Production-ready deployment patterns

### Implementation Roadmap

**Phase 1: Foundation** (Weeks 1-2)
- Deploy Vault cluster
- Implement basic API endpoints
- Set up monitoring and logging

**Phase 2: Core Features** (Weeks 3-4)
- Add license validation and renewal
- Implement client SDKs
- Deploy to staging environment

**Phase 3: Production** (Weeks 5-6)
- Security hardening
- Performance optimization
- Production deployment

**Phase 4: Advanced Features** (Weeks 7-8)
- Multi-tenant support
- Advanced analytics
- Integration with business systems

### Success Metrics
- **Availability**: 99.9% uptime target
- **Performance**: <200ms license validation
- **Security**: Zero cryptographic vulnerabilities
- **Compliance**: SOC 2 Type II certification

This system provides the foundation for a secure, scalable, and maintainable license management solution that can grow with your organization's needs while maintaining the highest standards of security and reliability. 