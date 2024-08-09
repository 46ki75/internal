import * as cdk from 'aws-cdk-lib'
import {
  DomainName,
  HttpApi,
  HttpMethod,
  HttpNoneAuthorizer,
  VpcLink
} from 'aws-cdk-lib/aws-apigatewayv2'
import {
  HttpLambdaIntegration,
  HttpUrlIntegration
} from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import { Function, Alias } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'
import {
  Certificate,
  CertificateValidation
} from 'aws-cdk-lib/aws-certificatemanager'
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { ApiGatewayv2DomainProperties } from 'aws-cdk-lib/aws-route53-targets'
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3'
import { Vpc } from 'aws-cdk-lib/aws-ec2'
import { AnyPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam'

interface ApiStackProps extends cdk.StackProps {
  hostedZone: HostedZone
  apiLambdaFunction: Function
  apiLambdaAlias: Alias
  graphqlLambdaFunction: Function
  graphqlLambdaAlias: Alias
  vpc: Vpc
  webS3Bucket: Bucket
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
      },
      ...props
    })

    // # --------------------------------------------------
    //
    // ACM
    //
    // # --------------------------------------------------

    const certificate = new Certificate(this, 'APIInternalCertificate', {
      domainName: 'internal.46ki75.com',
      validation: CertificateValidation.fromDns(props.hostedZone)
    })

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
        props.webS3Bucket.bucketWebsiteUrl
      ),
      defaultDomainMapping: { domainName: domain },
      disableExecuteApiEndpoint: false
    })

    httpApi.addRoutes({
      integration: new HttpLambdaIntegration('APILambda', props.apiLambdaAlias),
      path: '/api/{all+}',
      methods: [HttpMethod.ANY]
    })

    httpApi.addRoutes({
      integration: new HttpLambdaIntegration(
        'GraphQLLambda',
        props.graphqlLambdaAlias
      ),
      path: '/graphql/{all+}',
      methods: [HttpMethod.ANY]
    })

    httpApi.addVpcLink({
      vpcLinkName: 'internal-vpc',
      vpc: props.vpc,
      subnets: { subnets: props.vpc.publicSubnets }
    })

    // # --------------------------------------------------
    //
    // Route53 (Alias Record)
    //
    // # --------------------------------------------------

    new ARecord(this, 'AliasRecord', {
      zone: props.hostedZone,
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
