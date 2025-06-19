const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'LaTeX PDF API is running' });
});

// Main LaTeX compilation endpoint
app.post('/compile', async (req, res) => {
  try {
    const { latex, filename = 'document' } = req.body;

    if (!latex) {
      return res.status(400).json({ error: 'LaTeX content is required' });
    }

    // Create a unique filename to avoid conflicts
    const timestamp = Date.now();
    const texFile = `document_${timestamp}.tex`;
    const pdfFile = `document_${timestamp}.pdf`;
    const logFile = `document_${timestamp}.log`;
    const auxFile = `document_${timestamp}.aux`;

    // Write LaTeX content to file
    fs.writeFileSync(texFile, latex);

    // Compile LaTeX to PDF
    exec(`pdflatex -interaction=nonstopmode -output-directory=. ${texFile}`, (error, stdout, stderr) => {
      try {
        // Check if PDF was created
        if (fs.existsSync(pdfFile)) {
          const pdfBuffer = fs.readFileSync(pdfFile);
          
          // Set response headers
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
          res.setHeader('Content-Length', pdfBuffer.length);
          
          // Send PDF
          res.send(pdfBuffer);
        } else {
          console.error('PDF compilation failed:', { error, stdout, stderr });
          res.status(500).json({ 
            error: 'PDF compilation failed',
            details: stderr || error?.message || 'Unknown compilation error'
          });
        }
      } catch (readError) {
        console.error('Error reading PDF file:', readError);
        res.status(500).json({ error: 'Failed to read generated PDF' });
      } finally {
        // Clean up temporary files
        cleanupFiles([texFile, pdfFile, logFile, auxFile]);
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Alternative endpoint for form data
app.post('/compile-form', multer().none(), (req, res) => {
  try {
    const latex = req.body.latex;
    const filename = req.body.filename || 'document';

    if (!latex) {
      return res.status(400).json({ error: 'LaTeX content is required' });
    }

    // Create a unique filename to avoid conflicts
    const timestamp = Date.now();
    const texFile = `document_${timestamp}.tex`;
    const pdfFile = `document_${timestamp}.pdf`;
    const logFile = `document_${timestamp}.log`;
    const auxFile = `document_${timestamp}.aux`;

    // Write LaTeX content to file
    fs.writeFileSync(texFile, latex);

    // Compile LaTeX to PDF
    exec(`pdflatex -interaction=nonstopmode -output-directory=. ${texFile}`, (error, stdout, stderr) => {
      try {
        // Check if PDF was created
        if (fs.existsSync(pdfFile)) {
          const pdfBuffer = fs.readFileSync(pdfFile);
          
          // Set response headers
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
          res.setHeader('Content-Length', pdfBuffer.length);
          
          // Send PDF
          res.send(pdfBuffer);
        } else {
          console.error('PDF compilation failed:', { error, stdout, stderr });
          res.status(500).json({ 
            error: 'PDF compilation failed',
            details: stderr || error?.message || 'Unknown compilation error'
          });
        }
      } catch (readError) {
        console.error('Error reading PDF file:', readError);
        res.status(500).json({ error: 'Failed to read generated PDF' });
      } finally {
        // Clean up temporary files
        cleanupFiles([texFile, pdfFile, logFile, auxFile]);
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to clean up temporary files
function cleanupFiles(files) {
  files.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch (error) {
      console.error(`Failed to delete ${file}:`, error);
    }
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`LaTeX PDF API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Compile endpoint: http://localhost:${PORT}/compile`);
}); 