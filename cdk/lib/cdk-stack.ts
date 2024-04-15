import * as cdk from "aws-cdk-lib";
import { HttpApi, HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const lambda = new NodejsFunction(this, "Lambda", {
      entry: "../.output/server/index.mjs",
      handler: "handler",
      runtime: Runtime.NODEJS_20_X,
      functionName: "internal-serverless-api",
    });

    const httpApi = new HttpApi(this, "HttpApi", {
      apiName: "internal-serverless-api",
      createDefaultStage: true,
    });

    const lambdaIntegration = new HttpLambdaIntegration(
      "LambdaIntegration",
      lambda
    );

    httpApi.addRoutes({
      path: "/{all+}",
      methods: [HttpMethod.ANY],
      integration: lambdaIntegration,
    });
  }
}
