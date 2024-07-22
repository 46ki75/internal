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
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2'

export class VPCStack extends cdk.Stack {
  public readonly vpc: Vpc

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
    // VPC
    //
    // # --------------------------------------------------

    this.vpc = new Vpc(this, 'VPC', {
      availabilityZones: [
        'ap-northeast-1a',
        'ap-northeast-1c',
        'ap-northeast-1d'
      ],
      createInternetGateway: true,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 0,
      vpcName: 'internal-vpc',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: SubnetType.PUBLIC
        }
      ]
    })

    this.vpc.addGatewayEndpoint('GWEP', {
      service: { name: 'com.amazonaws.ap-northeast-1.s3' }
    })
  }
}
