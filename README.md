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
  help:
