| Directory | Service         | Language   | Framework | Description                                                                                                                                                  |
| --------- | --------------- | ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| gateway   | API Aggregation | Rust       | actix-web | Aggregates all backend servers. Handles restrictions for servers that require authentication.                                                                |
| web       | Frontend        | TypeScript | React     | Builds the frontend interface.                                                                                                                               |
| langchain | AI Service      | Python     | FastAPI   | Utilizes the ChatGPT API to its fullest potential with langchain. Chose Python due to the significantly larger community compared to TypeScript's langchain. |

## Starting a Development Container

In the development environment, it is necessary to mount the host machine's filesystem to the Docker container. This allows changes made on the host machine's files to be immediately reflected inside the container. Synchronizing the User ID (UID) and Group ID (GID) of the host machine with the container helps to avoid permission issues. Follow these steps to start your development container:

1. Retrieve and set the host machine's UID and GID as environment variables:

   ```bash
   export UID=$(id -u)
   export GID=$(id -g)
   ```

2. Use `docker-compose` to build and start the container:

   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

This procedure will start the development container with the UID/GID settings inherited from the host machine.

## Starting a Production Container

For the production environment, synchronizing the UID/GID with the host machine is not necessary. Execute the following command to build and start the production Docker container:

```bash
docker-compose -f docker-compose.prod.yml up --build
```

This command uses the production configuration file to build and start the Docker container, without the need for additional environment variable settings like in the development environment.
