# LaTeX PDF API

A Node.js Express server that compiles LaTeX to PDF using `pdflatex`. This service can be deployed to Render, Railway, or any VPS that supports Node.js and has TeX Live installed.

## Features

- Compiles LaTeX code to PDF
- Supports both JSON and form data requests
- Automatic cleanup of temporary files
- CORS enabled for cross-origin requests
- Health check endpoint
- Error handling and logging

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

## API Endpoints

### Health Check
```
GET /health
```

### Compile LaTeX to PDF (JSON)
```
POST /compile
Content-Type: application/json

{
  "latex": "\\documentclass{article}\\begin{document}Hello World!\\end{document}",
  "filename": "my-document"
}
```

### Compile LaTeX to PDF (Form Data)
```
POST /compile-form
Content-Type: application/x-www-form-urlencoded

latex=\documentclass{article}\begin{document}Hello World!\end{document}&filename=my-document
```

## Deployment

### Deploy to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following build settings:
   - **Build Command**: `npm install && sudo apt-get update && sudo apt-get install -y texlive-full`
   - **Start Command**: `npm start`
   - **Environment**: Node

### Deploy to Railway

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add the following to your `package.json`:
```json
{
  "scripts": {
    "postinstall": "apt-get update && apt-get install -y texlive-full"
  }
}
```

### Deploy to Heroku

1. Create a new app on Heroku
2. Add the TeX Live buildpack:
```bash
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-tex.git
heroku buildpacks:add heroku/nodejs
```

3. Deploy your app:
```bash
git push heroku main
```

## Usage in Your Next.js App

Update your `generate-pdf` API route to use this service:

```typescript
// In your Next.js API route
const response = await fetch('https://your-latex-api.onrender.com/compile', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    latex: latexContent,
    filename: 'cover-letter'
  }),
});

if (response.ok) {
  const pdfBuffer = await response.arrayBuffer();
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="cover-letter.pdf"',
    },
  });
}
```

## Environment Variables

- `PORT`: Server port (default: 3001)

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