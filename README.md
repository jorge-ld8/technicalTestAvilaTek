## Avila Tek Prueba Tecnica Backend - E-commerce API

This project is a robust and scalable REST API for a fictional e-commerce platform, built with Express.js and TypeScript. 

## Prerequisites

*   Npm/Node
*   Docker

## Getting Started

Follow these steps to get the project up and running on your local machine:

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/jorge-ld8/technicalTestAvilaTek.git avilaTek-technicalTest-Jorge-Leon
    cd avilaTek-technicalTest-Jorge-Leon
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Set Up Environment Variables**

    Create a `.env.development` file in ./config directory of the project by copying the example file:

    ```bash
    mkdir ./config
    cp .env.example ./config/.env.development
    ```

    Update the `.env.development` file with the .env file provided to you by the team.

4.  **Set Up Docker Container for RabbitMQ**

    Run the containers:

    ```bash
    docker-compose -f docker-compose.yaml up -d
    ```

    *   **RabbitMQ**: Access the management UI on `http://localhost:15672`.

5.  **Run the Application (Development Mode)**

    ```bash
    npm run dev
    ```
    Or for hot-reloading:
    ```bash
    npm run dev:hot
    ```
    The server will start, typically on `http://localhost:3010` (or the port you configured).
    The API documentation (Swagger) will be available at `http://localhost:3010/api-docs`.

6.  **Start the Order Worker**

    In a separate terminal, start the order worker to process background tasks:

    ```bash
    npm run start:worker
    ```
## API Documentation

Once the server is running, you can access the Swagger API documentation at:
`http://localhost:<PORT>/api-docs` (e.g., `http://localhost:3010/api-docs`)
