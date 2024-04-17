import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginProtocolPolicy,
  OriginRequestPolicy,
  ResponseHeadersPolicy,
  SSLMethod,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy
} from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import {
  Certificate,
  CertificateValidation
} from 'aws-cdk-lib/aws-certificatemanager'
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'

export class CloudFrontStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1'
      },
      ...props
    })

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
    // CloudFront
    //
    // # --------------------------------------------------

    const distribution = new Distribution(this, 'distro', {
      comment: 'internal CDN',
      defaultBehavior: {
        origin: new origins.HttpOrigin(
          '46ki75-internal-web-frontend.s3-website-ap-northeast-1.amazonaws.com',
          {
            protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
            originId: 's3'
          }
        ),
        viewerProtocolPolicy: ViewerProtocolPolicy.ALLOW_ALL,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: CachePolicy.CACHING_DISABLED
      },
      // additionalBehaviors: ,
      enabled: true,
      enableIpv6: true,
      domainNames: ['internal.46ki75.com'],
      certificate,
      defaultRootObject: 'index.html',
      enableLogging: true,
      errorResponses: []
    })

    distribution.addBehavior(
      '/api/*',
      new origins.HttpOrigin('api.internal.46ki75.com', {
        protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
        originId: 'api'
      }),
      {
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        // cachePolicy: CachePolicy.CACHING_DISABLED,
        responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS
      }
    )

    // # --------------------------------------------------
    //
    // Route53 (Alias Record)
    //
    // # --------------------------------------------------

    new ARecord(this, 'AliasRecord', {
      zone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      recordName: 'internal'
    })
  }
}
