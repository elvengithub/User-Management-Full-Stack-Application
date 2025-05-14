const path = require('path');
const fs = require('fs');

// Try to load the Swagger YAML file
try {
    const yamlPath = path.join(__dirname, 'swagger.yaml');
    if (fs.existsSync(yamlPath)) {
        console.log('Swagger YAML file found');
    } else {
        console.log('Swagger YAML file not found');
    }
} catch (e) {
    console.error('Error loading Swagger YAML:', e);
}

// Options for Swagger UI
const swaggerOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
        docExpansion: 'list',
        filter: true,
        showRequestDuration: true
    }
};

module.exports = swaggerOptions; 