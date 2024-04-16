import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import {
  AllowedMethods,
  CachePolicy,
  CloudFrontWebDistribution,
  Distribution,
  OriginProtocolPolicy
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

    const certificate = new Certificate(this, 'InternalCertificate', {
      domainName: 'internal.46ki75.com',
      validation: CertificateValidation.fromDns(zone)
    })

    // # --------------------------------------------------
    //
    // CloudFront
    //
    // # --------------------------------------------------

    const distribution = new Distribution(this, 'distro', {
      defaultBehavior: {
        origin: new origins.HttpOrigin('api.internal.46ki75.com', {
          protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY
        }),
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: CachePolicy.CACHING_DISABLED
      },
      enabled: true,
      enableIpv6: false,
      domainNames: ['internal.46ki75.com'],
      certificate
    })

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
