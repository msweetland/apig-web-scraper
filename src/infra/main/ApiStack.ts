import { Construct } from 'constructs';
import { DockerImageCode, DockerImageFunction, Architecture } from "aws-cdk-lib/aws-lambda";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { Duration, Stack, StackProps } from "aws-cdk-lib";

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const dockerLambda = new DockerImageFunction(this, 'DockerLambda', {
      code: DockerImageCode.fromImageAsset('.', {
        file: 'Dockerfile'
      }),
      memorySize: 2048,
      timeout: Duration.minutes(15),
      architecture: Architecture.X86_64
    });

    const api = new LambdaRestApi(this, 'APIGateway', {
      handler: dockerLambda,
      proxy: false
    });

    api.root.addMethod('POST');
  }
}
