import * as cdk from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import * as path from 'path'
import * as iam from 'aws-cdk-lib/aws-iam'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'

export class LambdaStack extends cdk.Stack {
  public readonly apiLambdaFunction: lambda.Function
  public readonly apiLambdaAlias: lambda.Alias
  public readonly graphqlLambdaFunction: lambda.Function
  public readonly graphqlLambdaAlias: lambda.Alias
  public readonly generateJwtSecretLambdaFunction: lambda.Function
  public readonly generateJwtSecretLambdaAlias: lambda.Alias

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

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    })

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:ap-northeast-1:${cdk.Stack.of(this).account}:parameter/internal/web/prod/jwt/secret`,
          `arn:aws:ssm:ap-northeast-1:${cdk.Stack.of(this).account}:parameter/internal/web/prod/notion/default/secret`,
          `arn:aws:ssm:ap-northeast-1:${cdk.Stack.of(this).account}:parameter/internal/general/common/notion/database/anki/id`,
          `arn:aws:ssm:ap-northeast-1:${cdk.Stack.of(this).account}:parameter/internal/general/common/notion/database/websites/id`,
          `arn:aws:ssm:ap-northeast-1:${cdk.Stack.of(this).account}:parameter/internal/web/prod/password`,
          `arn:aws:ssm:ap-northeast-1:${cdk.Stack.of(this).account}:parameter/internal/web/prod/openai/secret`
        ],
        effect: iam.Effect.ALLOW
      })
    )

    this.apiLambdaFunction = new lambda.Function(this, 'Lambda', {
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../nitro/.output/server')
      ),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: { NODE_ENV: 'production' },
      functionName: 'internal-api',
      role: lambdaRole,
      timeout: cdk.Duration.seconds(29)
    })

    this.apiLambdaAlias = new lambda.Alias(this, 'LambdaAlias', {
      aliasName: 'latest',
      version: this.apiLambdaFunction.latestVersion
    })

    // # --------------------------------------------------------------------------------
    //
    // GraphQL
    //
    // # --------------------------------------------------------------------------------

    this.graphqlLambdaFunction = new lambda.Function(this, 'GraphQLLambda', {
      code: lambda.Code.fromAsset(
        path.join(__dirname, '../../graphql/target/lambda/graphql')
      ),
      handler: 'index.handler',
      runtime: lambda.Runtime.PROVIDED_AL2023,
      environment: { ENVIRONMENT: 'production' },
      functionName: 'graphql',
      role: lambdaRole,
      timeout: cdk.Duration.seconds(29)
    })

    this.graphqlLambdaAlias = new lambda.Alias(this, 'GraphQLLambdaAlias', {
      aliasName: 'latest',
      version: this.graphqlLambdaFunction.latestVersion
    })

    // # --------------------------------------------------------------------------------
    //
    // generate-jwt-secret
    //
    // # --------------------------------------------------------------------------------

    const generateJwtSecretLambdaRole = new iam.Role(
      this,
      'GenerateJwtSecretLambdaRole',
      { assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com') }
    )

    generateJwtSecretLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:PutItem'],
        resources: [
          `arn:aws:ssm:ap-northeast-1:${cdk.Stack.of(this).account}:table/jwt-keystore`
        ],
        effect: iam.Effect.ALLOW
      })
    )

    this.generateJwtSecretLambdaFunction = new lambda.Function(
      this,
      'GenerateJwtSecretLambda',
      {
        code: lambda.Code.fromAsset(
          path.join(
            __dirname,
            '../../lambda/generate-jwt-secret/target/lambda/generate-jwt-secret'
          )
        ),
        handler: 'index.handler',
        runtime: lambda.Runtime.PROVIDED_AL2023,
        environment: { ENVIRONMENT: 'production' },
        functionName: 'generate-jwt-secret',
        timeout: cdk.Duration.seconds(29)
      }
    )

    this.generateJwtSecretLambdaAlias = new lambda.Alias(
      this,
      'GenerateJwtSecretLambdaAlias',
      {
        aliasName: 'latest',
        version: this.generateJwtSecretLambdaFunction.latestVersion
      }
    )

    // # --------------------------------------------------------------------------------
    //
    // notion-convert-block
    //
    // # --------------------------------------------------------------------------------

    new NodejsFunction(this, 'notion-convert-block', {
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: { NODE_ENV: 'production' },
      functionName: 'notion-convert-block',
      timeout: cdk.Duration.seconds(29),
      entry: path.resolve(
        __dirname,
        '../../lambda/notion-convert-block/src/index.ts'
      ),
      role: lambdaRole
    })
  }
}
