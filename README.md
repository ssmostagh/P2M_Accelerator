# Universal Fashion Platform

This project is a web application that allows users to virtually try on garments. It uses a backend powered by Google's Gemini API to generate images and videos of a model wearing a selected garment.

## Running the Project

### Prerequisites

- Node.js and npm
- A Google Cloud project with the AI Platform API enabled
- Authenticated `gcloud` CLI

### Installation

1.  Clone the repository.
2.  Install the dependencies:

    ```bash
    npm install
    ```

### Running the Application

1.  Set the `GOOGLE_PROJECT_ID` environment variable to your Google Cloud project ID:

    ```bash
    export GOOGLE_PROJECT_ID="your-project-id"
    ```

2.  Start the server:

    ```bash
    node server.js
    ```

3.  Open your browser and navigate to `http://localhost:8080`.