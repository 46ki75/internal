import * as cdk from 'aws-cdk-lib'
import {
  CorsHttpMethod,
  DomainName,
  HttpApi,
  HttpIntegration,
  HttpMethod,
  HttpNoneAuthorizer
} from 'aws-cdk-lib/aws-apigatewayv2'
import {
  HttpLambdaIntegration,
  HttpUrlIntegration
} from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import { Function, Code, Runtime, Version } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import * as path from 'path'
import {
  Certificate,
  CertificateValidation
} from 'aws-cdk-lib/aws-certificatemanager'
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { ApiGatewayv2DomainProperties } from 'aws-cdk-lib/aws-route53-targets'
import {
  Effect,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal
} from 'aws-cdk-lib/aws-iam'

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'ap-northeast-1'
      },
      ...props
    })

    // # --------------------------------------------------
    //
    // Route53 (fetch zone)
    //
    // # --------------------------------------------------

    const zone = HostedZone.fromLookup(this, 'Zone', {
      domainName: 'internal.46ki75.com'
    })

    // # --------------------------------------------------
    //
    // ACM
    //
    // # --------------------------------------------------

    const certificate = new Certificate(this, 'APIInternalCertificate', {
      domainName: 'internal.46ki75.com',
      validation: CertificateValidation.fromDns(zone)
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
          `arn:aws:ssm:ap-northeast-1:${cdk.Stack.of(this).account}:parameter/internal/web/prod/password`,
          `arn:aws:ssm:ap-northeast-1:${cdk.Stack.of(this).account}:parameter/internal/web/prod/openai/secret`
        ],
        effect: Effect.ALLOW
      })
    )

    const lambda = new Function(this, 'Lambda', {
      code: Code.fromAsset(path.join(__dirname, '../../nitro/.output/server')),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_20_X,
      environment: { NODE_ENV: 'production' },
      functionName: 'internal-api',
      role: lambdaRole,
      timeout: cdk.Duration.seconds(29)
    })

    const version = new Version(this, 'LambdaVersion', { lambda })

    // # --------------------------------------------------
    //
    // Amazon API Gateway
    //
    // # --------------------------------------------------

    const domain = new DomainName(this, 'APIGWDomainName', {
      certificate,
      domainName: 'internal.46ki75.com'
    })

    const httpApi = new HttpApi(this, 'HttpApi', {
      apiName: 'internal-serverless-api',
      description: 'Internal HTTP API',
      createDefaultStage: true,
      defaultAuthorizationScopes: [],
      defaultAuthorizer: new HttpNoneAuthorizer(),
      defaultIntegration: new HttpUrlIntegration(
        'S3Integration',
        `http://${cdk.Stack.of(this).account}-internal-web-frontend.s3-website-ap-northeast-1.amazonaws.com/`
      ),
      defaultDomainMapping: { domainName: domain },
      disableExecuteApiEndpoint: false
    })

    httpApi.addRoutes({
      integration: new HttpLambdaIntegration('APILambda', lambda),
      path: '/api/{all+}',
      methods: [HttpMethod.ANY]
    })

    // # --------------------------------------------------
    //
    // Route53 (Alias Record)
    //
    // # --------------------------------------------------

    new ARecord(this, 'AliasRecord', {
      zone,
      target: RecordTarget.fromAlias(
        new ApiGatewayv2DomainProperties(
          domain.regionalDomainName,
          domain.regionalHostedZoneId
        )
      ),
      recordName: ''
    })
  }
}
