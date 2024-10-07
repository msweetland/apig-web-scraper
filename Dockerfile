# Use the official AWS Lambda Node.js 20 base image
FROM public.ecr.aws/lambda/nodejs:20

# Set working directory
WORKDIR /var/task

# Copy package files and install dependencies
COPY package*.json tsconfig.json ./

RUN npm install

# Copy source code
COPY src ./src

# Build TypeScript code
RUN npx tsc

# Set the CMD to your handler
CMD [ "dist/handler.handler" ]