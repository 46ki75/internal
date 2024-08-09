import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { HostedZone } from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'

export class Route53Stack extends Stack {
  public readonly hostedZone: HostedZone

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
      },
      ...props
    })

    this.hostedZone = new HostedZone(this, 'InternalHostedZone', {
      zoneName: 'internal.46ki75.com'
    })

    this.hostedZone.applyRemovalPolicy(RemovalPolicy.RETAIN)
  }
}
