import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { HostedZone } from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'

export class Route53Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'ap-northeast-1'
      },
      ...props
    })

    const hostedZone = new HostedZone(this, 'InternalHostedZone', {
      zoneName: 'internal.46ki75.com'
    })
  }
}
