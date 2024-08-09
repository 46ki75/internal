import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import path = require('path')

export class S3Stack extends cdk.Stack {
  public readonly webS3Bucket: Bucket

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
    // S3 Bucket
    //
    // # --------------------------------------------------

    this.webS3Bucket = new Bucket(this, 'VueJsBucket', {
      bucketName: `${cdk.Stack.of(this).account}-internal-web-frontend`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: '404.html',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      publicReadAccess: true
    })

    // # --------------------------------------------------------------------------------
    //
    // S3 Deployment
    //
    // # --------------------------------------------------------------------------------

    new BucketDeployment(this, 'Deployment', {
      destinationBucket: this.webS3Bucket,
      sources: [
        Source.asset(path.resolve(__dirname, '../../web/.output/public'))
      ]
    })
  }
}
