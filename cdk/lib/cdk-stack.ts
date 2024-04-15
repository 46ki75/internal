import * as cdk from "aws-cdk-lib";
import { HttpApi, HttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    const lambda = new NodejsFunction(this, "Lambda", {
      // projectRoot: "..",
      entry: "../.output/server/index.mjs",
      handler: "handler",
      runtime: Runtime.NODEJS_20_X,
      functionName: "internal-serverless-api",
    });

    const httpApi = new HttpApi(this, "HttpApi", {
      apiName: "internal-serverless-api",
      createDefaultStage: true,
    });

    // Lambda統合の設定
    const lambdaIntegration = new HttpLambdaIntegration(
      "LambdaIntegration",
      lambda
    );

    // ルートの追加
    httpApi.addRoutes({
      path: "/{all+}",
      methods: [HttpMethod.GET, HttpMethod.POST],
      integration: lambdaIntegration,
    });
  }
}
