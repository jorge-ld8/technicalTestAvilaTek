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

    Create a `.env` file in the root of the project by copying the example file:

    ```bash
    mkdir ./config
    cp .env.example ./config/.env.development
    ```

    Update the `.env` file with your specific configurations.

4.  **Set Up Docker Container for RabbitMQ (RabbitMQ)**

    Run the containers:

    ```bash
    docker-compose -f docker-compose.yaml up -d
    ```

    *   **RabbitMQ**: Access the management UI on `http://localhost:15672`.

5.  **Database Migrations**

    Apply the database schema using Prisma migrations:

    ```bash
    npx prisma migrate dev --name init 
    ```
    This command will also generate the Prisma Client based on your schema.
    If you make changes to the `schema.prisma` file, run `npx prisma generate` to update the client.

6.  **Run the Application (Development Mode)**

    ```bash
    npm run dev
    ```
    Or for hot-reloading:
    ```bash
    npm run dev:hot
    ```
    The server will start, typically on `http://localhost:3000` (or the port you configured).
    The API documentation (Swagger) will be available at `http://localhost:3000/api-docs`.

    **IMPORTANT**: Development mode uses `swc` for performance, which **does not** perform type checking. Run `npm run type-check` to check for TypeScript errors. Your IDE should also help catch these.

7.  **Start the Order Worker**

    In a separate terminal, start the order worker to process background tasks:

    ```bash
    npm run start:worker
    ```
## API Documentation

Once the server is running, you can access the Swagger API documentation at:
`http://localhost:<PORT>/api-docs` (e.g., `http://localhost:3000/api-docs`)
