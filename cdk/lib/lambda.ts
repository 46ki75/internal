import * as cdk from 'aws-cdk-lib'
import { Function, Code, Runtime, Version, Alias } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import * as path from 'path'
import { HostedZone } from 'aws-cdk-lib/aws-route53'
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal
} from 'aws-cdk-lib/aws-iam'

export class LambdaStack extends cdk.Stack {
  public readonly apiLambdaFunction: Function
  public readonly apiLambdaAlias: Alias

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
      },
      ...props
    })

    // # --------------------------------------------------
    //
    // AWS Lambda
    //
    // # --------------------------------------------------

    const lambdaRole = new Role(this, 'LambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com')
    })

    lambdaRole.addToPolicy(
      new PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:ap-northeast-1:${cdk.Stack.of(this).account}:parameter/internal/web/prod/jwt/secret`,
          `arn:aws:ssm:ap-northeast-1:${cdk.Stack.of(this).account}:parameter/internal/web/prod/notion/default/secret`,
          `arn:aws:ssm:ap-northeast-1:${cdk.Stack.of(this).account}:parameter/internal/general/common/notion/database/anki/id`,
          `arn:aws:ssm:ap-northeast-1:${cdk.Stack.of(this).account}:parameter/internal/general/common/notion/database/websites/id`,
          `arn:aws:ssm:ap-northeast-1:${cdk.Stack.of(this).account}:parameter/internal/web/prod/password`,
          `arn:aws:ssm:ap-northeast-1:${cdk.Stack.of(this).account}:parameter/internal/web/prod/openai/secret`
        ],
        effect: Effect.ALLOW
      })
    )

    this.apiLambdaFunction = new Function(this, 'Lambda', {
      code: Code.fromAsset(path.join(__dirname, '../../nitro/.output/server')),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_20_X,
      environment: { NODE_ENV: 'production' },
      functionName: 'internal-api',
      role: lambdaRole,
      timeout: cdk.Duration.seconds(29)
    })

    const version = new Version(this, 'LambdaVersion', {
      lambda: this.apiLambdaFunction
    })

    this.apiLambdaAlias = new Alias(this, 'LambdaAlias', {
      aliasName: 'latest',
      version: this.apiLambdaFunction.latestVersion
    })
  }
}
