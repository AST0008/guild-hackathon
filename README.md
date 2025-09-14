# MintLoop: Insurance Management System

## Description

This is a scalable and type-safe Insurance Management System built with Next.js, Python designed to handle customers, documents, payments, communications, and analytics. The system is deployed on AWS Amplify and leverages a modern tech stack for optimal performance and maintainability.

## Features

*   **Customer Management:** Efficiently manage customer data and interactions.
*   **Document Handling:** Securely store and manage insurance-related documents using AWS S3.
*   **Payment Processing:** Handle insurance payments with robust and reliable mechanisms.
*   **Communication Tools:** Integrated communication features for seamless customer interaction.
*   **Analytics Dashboard:** Gain insights into key metrics with a comprehensive analytics dashboard.
*   **PDF Generation & Parsing:** Generate and parse PDF documents using `html-pdf`.
*   **UI Components:** Utilizes Radix UI for accessible and customizable UI components.
*   **Form Validation:** Leverages React Hook Form and Zod for robust form validation.
*   **Authentication:** Secure user authentication.
*   **Data Visualization:** Utilizes Recharts for creating insightful data visualizations.

## Technologies Used

*   **Frontend:**
    *   [Next.js](https://nextjs.org): React framework for building performant web applications.
    *   [React](https://reactjs.org): JavaScript library for building user interfaces.
    *   [React Hook Form](https://react-hook-form.com/): Library for form management and validation.
    *   [Zod](https://zod.dev/): TypeScript-first schema declaration with static type inference.
    *   [Tailwind CSS](https://tailwindcss.com): Utility-first CSS framework.
    *   [Lucide React](https://lucide.dev/): Beautifully simple, pixel-perfect icons.
*   **Backend/Utilities:**
    *   [FastAPI](https://fastapi.tiangolo.com/): Modern, fast web framework for building APIs with Python.
    *   [Twilio](https://www.twilio.com/): Cloud communications platform for SMS messaging.
    *   [@aws-sdk/client-s3](https://www.npmjs.com/package/@aws-sdk/client-s3): AWS SDK for interacting with S3.
    *   [@aws-sdk/s3-request-presigner](https://www.npmjs.com/package/@aws-sdk/s3-request-presigner): AWS SDK for generating pre-signed S3 URLs.
    *   [pg](https://node-postgres.com/): PostgreSQL client for Node.js.
    *   [html-pdf](https://www.npmjs.com/package/html-pdf): HTML to PDF converter
*   **Other:**
    *   [PostgreSQL](https://www.postgresql.org/): Database.
    *   [AWS Amplify](https://aws.amazon.com/amplify/): Cloud platform for deploying and hosting web applications.

## Installation

1.  Clone the repository:

    ```bash
    git clone <repository_url>
    ```

2.  Navigate to the project directory:

    ```bash
    cd guild-hackathon
    ```

3.  Install dependencies:

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    # or
    bun install
    ```

## Usage

1.  Start the development server:

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    # or
    bun dev
    ```

2.  Open your browser and navigate to `http://localhost:3000` to view the application.

## License

MIT
