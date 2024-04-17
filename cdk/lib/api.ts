import * as cdk from 'aws-cdk-lib'
import {
  CorsHttpMethod,
  DomainName,
  HttpApi,
  HttpIntegration,
  HttpNoneAuthorizer
} from 'aws-cdk-lib/aws-apigatewayv2'
import {
  HttpLambdaIntegration,
  HttpUrlIntegration
} from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import { Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import * as path from 'path'
import {
  Certificate,
  CertificateValidation
} from 'aws-cdk-lib/aws-certificatemanager'
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { ApiGatewayv2DomainProperties } from 'aws-cdk-lib/aws-route53-targets'

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
      domainName: '46ki75.com'
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

    // const lambda = new Function(this, 'Lambda', {
    //   code: Code.fromAsset(path.join(__dirname, '../../nitro/.output/server')),
    //   handler: 'index.handler',
    //   runtime: Runtime.NODEJS_20_X,
    //   environment: { JWT_SECRET: 'placeholders' }
    // })

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
      corsPreflight: {
        allowCredentials: true,
        allowOrigins: ['https://internal.46ki75.com'],
        allowMethods: [CorsHttpMethod.ANY]
      },
      createDefaultStage: true,
      defaultAuthorizationScopes: [],
      defaultAuthorizer: new HttpNoneAuthorizer(),
      defaultIntegration: new HttpUrlIntegration(
        'S3Integration',
        'http://46ki75-internal-web-frontend.s3-website-ap-northeast-1.amazonaws.com/'
      ),
      defaultDomainMapping: { domainName: domain },
      disableExecuteApiEndpoint: false
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
      recordName: 'api.internal'
    })
  }
}
