const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const VAULT_ADDR = 'http://127.0.0.1:8200';
const VAULT_TOKEN = process.env.VAULT_TOKEN || 'myroot';

// Helper: Sign payload in Vault
async function signLicense(payload) {
    try {
        const input = Buffer.from(JSON.stringify(payload)).toString('base64');
        
        // Use the correct signing key name
        const response = await axios.post(`${VAULT_ADDR}/v1/transit/sign/license-signing-key`, {
            input
        }, {
            headers: { 
                'X-Vault-Token': VAULT_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        
        return response.data.data.signature;
    } catch (error) {
        console.error('Vault signing error:', error.response?.data || error.message);
        throw new Error(`Failed to sign license: ${error.response?.data?.errors?.[0] || error.message}`);
    }
}

// Helper: Verify signature in Vault
async function verifyLicense(payload, signature) {
    try {
        const input = Buffer.from(JSON.stringify(payload)).toString('base64');
        
        const response = await axios.post(`${VAULT_ADDR}/v1/transit/verify/license-signing-key`, {
            input,
            signature
        }, {
            headers: { 
                'X-Vault-Token': VAULT_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        
        return response.data.data.valid;
    } catch (error) {
        console.error('Vault verification error:', error.response?.data || error.message);
        return false;
    }
}

// Issue license
app.post('/license/issue', async (req, res) => {
    try {
        const { customer, modules, expires_at } = req.body;
        
        if (!customer || !modules || !expires_at) {
            return res.status(400).json({ 
                error: 'Missing required fields: customer, modules, expires_at' 
            });
        }
        
        const license = { 
            license_id: Date.now().toString(), 
            customer, 
            modules, 
            issued_at: new Date().toISOString(), 
            expires_at 
        };
        
        // Create signature for the license
        license.signature = await signLicense(license);
        
        res.json({
            success: true,
            license
        });
    } catch (error) {
        console.error('License issuance error:', error.message);
        res.status(500).json({ 
            error: 'Failed to issue license',
            details: error.message
        });
    }
});

// Validate license
app.post('/license/validate', async (req, res) => {
    try {
        const { license } = req.body;
        
        if (!license || !license.signature) {
            return res.status(400).json({ 
                error: 'Invalid license format - missing license or signature' 
            });
        }
        
        // Extract signature and create clean payload for verification
        const { signature, ...licensePayload } = license;
        
        // Verify signature with Vault
        const isValid = await verifyLicense(licensePayload, signature);
        
        // Additional validation: check expiration
        const now = new Date();
        const expiresAt = new Date(license.expires_at);
        const isExpired = now > expiresAt;
        
        res.json({ 
            valid: isValid && !isExpired,
            signature_valid: isValid,
            expired: isExpired,
            license: license
        });
    } catch (error) {
        console.error('License validation error:', error.message);
        res.status(500).json({ 
            error: 'Failed to validate license',
            details: error.message
        });
    }
});

// Renew license
app.post('/license/renew', async (req, res) => {
    try {
        const { license, new_expires_at } = req.body;
        
        if (!license || !new_expires_at) {
            return res.status(400).json({ 
                error: 'Missing required fields: license, new_expires_at' 
            });
        }
        
        // First verify the existing license
        const { signature, ...originalPayload } = license;
        const isOriginalValid = await verifyLicense(originalPayload, signature);
        
        if (!isOriginalValid) {
            return res.status(400).json({ 
                error: 'Cannot renew invalid license' 
            });
        }
        
        // Create new license with updated expiration
        const newLicense = { 
            ...originalPayload,
            expires_at: new_expires_at, 
            issued_at: new Date().toISOString(),
            renewed_from: license.license_id
        };
        
        // Generate new license ID and signature
        newLicense.license_id = Date.now().toString();
        newLicense.signature = await signLicense(newLicense);
        
        res.json({
            success: true,
            license: newLicense
        });
    } catch (error) {
        console.error('License renewal error:', error.message);
        res.status(500).json({ 
            error: 'Failed to renew license',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check Vault connectivity
        const response = await axios.get(`${VAULT_ADDR}/v1/sys/health`, {
            headers: { 'X-Vault-Token': VAULT_TOKEN }
        });
        
        res.json({ 
            status: 'healthy',
            vault_status: response.data
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'unhealthy',
            error: error.message
        });
    }
});

// List all available keys (for debugging)
app.get('/keys', async (req, res) => {
    try {
        const response = await axios.get(`${VAULT_ADDR}/v1/transit/keys`, {
            headers: { 'X-Vault-Token': VAULT_TOKEN },
            params: { list: true }
        });
        
        res.json({
            keys: response.data.data.keys
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to list keys',
            details: error.message
        });
    }
});

// Get key information (for debugging)
app.get('/keys/:keyName', async (req, res) => {
    try {
        const { keyName } = req.params;
        const response = await axios.get(`${VAULT_ADDR}/v1/transit/keys/${keyName}`, {
            headers: { 'X-Vault-Token': VAULT_TOKEN }
        });
        
        res.json(response.data.data);
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to get key information',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
    });
});

app.listen(3000, () => {
    console.log('Demo license API running on port 3000');
    console.log('Endpoints:');
    console.log('  POST /license/issue - Issue new license');
    console.log('  POST /license/validate - Validate license signature');
    console.log('  POST /license/renew - Renew existing license');
    console.log('  GET /health - Check API health');
    console.log('  GET /keys - List all keys');
    console.log('  GET /keys/:keyName - Get key information');
});