# Oral Cancer Detection System

A sophisticated web application that uses AI to analyze oral cavity images for potential cancer detection, incorporating detailed patient history for more accurate risk assessment.

## Features

- Image upload and camera capture functionality
- Comprehensive patient data collection
- AI-powered image analysis using Claude 3 Opus
- Detailed risk assessment and confidence scoring
- Secure authentication and data handling
- Modern, responsive UI with smooth animations

## Tech Stack

- **Frontend:**
  - React with TypeScript
  - Tailwind CSS for styling
  - Framer Motion for animations
  - Zod for schema validation

- **Backend:**
  - Node.js with Express
  - Anthropic's Claude 3 Opus for AI analysis
  - Prisma for database management
  - JWT for authentication

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with the following:
   ```
   VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
   JWT_SECRET=your_jwt_secret
   DATABASE_URL=your_database_url
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Upload an image or use the camera to capture an oral cavity image
2. Fill in the patient's medical history and risk factors
3. Click "Analyze Image" to get AI-powered analysis
4. Review the detailed analysis, confidence score, and risk assessment

## Security

- JWT-based authentication
- Environment variable protection
- Secure file handling
- Data validation using Zod

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License
