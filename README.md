| Directory | Service         | Language   | Framework | Description                                                                                                                                                  |
| --------- | --------------- | ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| gateway   | API Aggregation | Rust       | actix-web | Aggregates all backend servers. Handles restrictions for servers that require authentication.                                                                |
| web       | Frontend        | TypeScript | React     | Builds the frontend interface.                                                                                                                               |
| langchain | AI Service      | Python     | Flask     | Utilizes the ChatGPT API to its fullest potential with langchain. Chose Python due to the significantly larger community compared to TypeScript's langchain. |
