# LaTeX PDF API Server

A Node.js server that compiles LaTeX documents to PDF using pdflatex.

## Features

- LaTeX to PDF compilation
- CORS enabled for cross-origin requests
- Health check endpoint
- File cleanup after compilation
- Support for both JSON and form data

## Endpoints

- `GET /health` - Health check
- `POST /compile` - Compile LaTeX to PDF (JSON)
- `POST /compile-form` - Compile LaTeX to PDF (Form data)

## Usage

### JSON Request
```bash
curl -X POST https://your-railway-url.railway.app/compile \
  -H "Content-Type: application/json" \
  -d '{"latex": "\\documentclass{article}\\begin{document}Hello World\\end{document}", "filename": "test"}'
```

### Form Data Request
```bash
curl -X POST https://your-railway-url.railway.app/compile-form \
  -F "latex=\\documentclass{article}\\begin{document}Hello World\\end{document}" \
  -F "filename=test"
```

## Deployment

This server is designed to be deployed on Railway with Docker support.

## Environment Variables

- `PORT` - Server port (default: 3001)

## Requirements

- Node.js 18+
- TeX Live (pdflatex must be available in PATH)

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Make sure TeX Live is installed on your system:
```bash
# On Ubuntu/Debian
sudo apt-get install texlive-full

# On macOS
brew install --cask mactex

# On Windows
# Download and install MiKTeX or TeX Live
```

3. Start the server:
```bash
npm start
```

The API will be available at `http://localhost:3001`

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: PDF generated successfully
- `400`: Missing LaTeX content
- `500`: Compilation error or server error

## Security Considerations

- This API accepts arbitrary LaTeX code
- Consider adding authentication if deploying publicly
- LaTeX compilation can be resource-intensive
- Consider rate limiting for production use

## Troubleshooting

### Common Issues

1. **pdflatex not found**: Make sure TeX Live is installed
2. **Permission denied**: Check file permissions in the deployment environment
3. **Memory issues**: LaTeX compilation can be memory-intensive

### Debug Mode

Enable debug logging by setting the `DEBUG` environment variable:
```bash
DEBUG=* npm start
``` 