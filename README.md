# Puppeteer Lambda API with AWS CDK and Docker

This project provides a serverless web scraping API using AWS Lambda and Puppeteer. You can send a URL, cookies, and a return type via a POST request to scrape content from a webpage. The API is designed to be deployed on AWS Lambda, using AWS CDK for infrastructure provisioning.

## **Request Body Format**

The API expects a JSON object with the following fields in the request body:

### **1. `url` (Required)**

- **Type**: `string`
- **Description**: The URL of the webpage you want to scrape.
- **Example**: `"https://example.com"`

### **2. `cookies` (Required)**

- **Type**: `array of objects`
- **Description**: An array of cookies that should be sent with the request. Each cookie is represented as an object with the following fields:
    - **`name`**: The name of the cookie.
        - **Example**: `"session_id"`
    - **`value`**: The value of the cookie.
        - **Example**: `"your_session_id"`
    - **`domain`**: The domain for which the cookie is valid.
        - **Example**: `"example.com"`

- **Example**:
  ```json
  "cookies": [
    {
      "name": "session_id",
      "value": "your_session_id",
      "domain": "example.com"
    },
    {
      "name": "user_id",
      "value": "your_user_id",
      "domain": "example.com"
    }
  ]
  ```

### **3. `returnType` (Required)**

- **Type**: `string`
- **Description**: Determines the type of content you want to retrieve from the page. There are two possible values:
    - **`HTML`**: Returns the full HTML of the page.
    - **`InnerText`**: Returns only the inner text of the `<body>` tag. This excludes all HTML tags and gives you only the visible text.

  #### **Difference between `HTML` and `InnerText`**:
    - **`HTML`**: Full page HTML, including all tags and attributes. It provides the entire structure of the webpage, but the response will be larger.
    - **`InnerText`**: Only the visible text content within the `<body>` tag, without any HTML tags. The response will be much smaller and is useful when you only need the content text.

- **Example**: `"InnerText"`

### **4. `timeoutMs` (Optional, Default: 5000, Max: 20000)**

- **Type**: `integer`
- **Description**: Timeout for the Puppeteer request in milliseconds. The default value is **5000 milliseconds (5 seconds)**, and the maximum value is **20000 milliseconds (20 seconds)** to conform with API Gateway's 29-second response requirement.
- **Example**: `15000` (15 seconds)

### **Full Example Request**

```json
{
  "url": "https://example.com",
  "cookies": [
    {
      "name": "session_id",
      "value": "your_session_id",
      "domain": "example.com"
    },
    {
      "name": "user_id",
      "value": "your_user_id",
      "domain": "example.com"
    }
  ],
  "returnType": "HTML",
  "timeoutMs": 15000
}
```

---

## **Running Locally**

You can run the API locally using Docker. When running locally, **the full API Gateway Request** structure is used, not just the request body.

1. **Build the Docker image**:
   ```bash
   npm run docker:build
   ```

2. **Run the Docker container**:
   ```bash
   npm run docker:run
   ```

3. **Send a POST request**:

   After running the container, send a POST request that includes the full API Gateway event structure to invoke the Lambda function locally:

   ```bash
   curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
   -H "Content-Type: application/json" \
   -d '{
     "resource": "/{proxy+}",
     "path": "/testpath",
     "httpMethod": "POST",
     "headers": {
       "Content-Type": "application/json"
     },
     "multiValueHeaders": {
       "Content-Type": ["application/json"]
     },
     "queryStringParameters": null,
     "multiValueQueryStringParameters": null,
     "pathParameters": {
       "proxy": "testpath"
     },
     "stageVariables": null,
     "requestContext": {
       "resourceId": "123456",
       "resourcePath": "/{proxy+}",
       "httpMethod": "POST",
       "extendedRequestId": "request-id",
       "requestTime": "10/Oct/2020:12:34:56 +0000",
       "path": "/testpath",
       "accountId": "123456789012",
       "protocol": "HTTP/1.1",
       "stage": "test",
       "domainPrefix": "testPrefix",
       "requestTimeEpoch": 1602339296000,
       "requestId": "request-id",
       "identity": {
         "sourceIp": "127.0.0.1",
         "userAgent": "Custom User Agent String"
       },
       "domainName": "test.domain.name",
       "apiId": "api-id"
     },
     "body": "{\"url\":\"https://example.com\",\"cookies\":[],\"returnType\":\"HTML\"}",
     "isBase64Encoded": false
   }'
   ```

This mimics the structure of an API Gateway request, allowing you to test the function locally using the Lambda Runtime Interface Emulator (RIE).

---

## **Scripts in `package.json`**

The `package.json` includes several useful scripts to build, test, and run the application locally or via Docker.

```json
{
  "scripts": {
    "test": "jest", // Runs unit tests
    "test:watch": "jest --watch", // Watches for file changes to rerun tests
    "docker:build": "docker build --platform linux/amd64 -t puppeteer:latest .", // Builds Docker image for Lambda
    "docker:run": "docker run --platform linux/amd64 -p 9000:8080 puppeteer:latest", // Runs the Docker container locally
    "build": "tsc", // Compiles TypeScript into JavaScript
    "watch": "tsc -w", // Watches for TypeScript file changes and recompiles
    "cdk": "cdk", // CDK command to work with AWS infrastructure
    "buildDeploy": "tsc && cdk deploy" // Builds the code and deploys via AWS CDK
  }
}
```

### **Explanation of Key Scripts**:

- **`docker:build`**: Builds the Docker image using the `Dockerfile` and the AMD64 platform to match Lambda architecture.
- **`docker:run`**: Runs the built Docker container locally and exposes port 9000 for testing Lambda functions via RIE.
- **`buildDeploy`**: Compiles the TypeScript code and deploys the infrastructure using AWS CDK.

---

## **Infrastructure Deployment with AWS CDK**

This project uses AWS CDK v2.0 for defining and deploying infrastructure.

### **Bootstrapping the AWS Account**

Before deploying AWS CDK resources, you need to **bootstrap** your AWS account. This command sets up the necessary infrastructure in your account for AWS CDK deployments.

```bash
cdk bootstrap
```

This command prepares your AWS environment for deploying AWS Lambda, API Gateway, and other AWS resources.

### **Deploying the Infrastructure**

After bootstrapping, you can deploy the infrastructure by running:

```bash
npm run buildDeploy
```

This command compiles the TypeScript code and deploys the infrastructure using AWS CDK.

### **Provisioned Resources and Estimated Costs (these are subject to change, please review)**

When deploying the infrastructure via AWS CDK, the following AWS resources are provisioned:

- **AWS Lambda Function**:
    - Runs a Docker container with Puppeteer for web scraping.
    - **Memory**: 2048 MB (2 GB).
    - **Timeout**: 15 minutes.
    - **Architecture**: `x86_64`.
    - **Estimated Cost**: AWS Lambda charges based on the number of requests and execution duration. For example:
        - **Request Cost**: $0.20 per 1 million requests.
        - **Duration Cost**: $0.00001667 per GB-second. With 2 GB memory and a 5-second execution time, each execution costs approximately $0.000167 per request.

- **API Gateway**:
    - Exposes the Lambda function via a REST API to accept HTTP POST requests.
    - **Estimated Cost**: API Gateway charges based on the number of API requests.
        - **Cost**: $3.50 per million requests.

### **Approximate Monthly Costs**:
For an average usage scenario (e.g., 100,000 requests per month with an average execution time of 5 seconds):

- **Lambda Cost**: ~$1.67
- **API Gateway Cost**: ~$0.35

For larger usage, costs will scale accordingly based on request volume and execution time.