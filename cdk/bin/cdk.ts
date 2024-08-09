#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { ApiStack } from '../lib/api'
import { Route53Stack } from '../lib/route53'
import { LambdaStack } from '../lib/lambda'
import { VPCStack } from '../lib/vpc'
import { S3Stack } from '../lib/s3'

const app = new cdk.App()

const vpcStack = new VPCStack(app, 'vpc')

const lambdaStack = new LambdaStack(app, 'lambda')

const route53Stack = new Route53Stack(app, 'route53')

const s3Stack = new S3Stack(app, 's3')

const apiStack = new ApiStack(app, 'api', {
  hostedZone: route53Stack.hostedZone,
  apiLambdaFunction: lambdaStack.apiLambdaFunction,
  apiLambdaAlias: lambdaStack.apiLambdaAlias,
  vpc: vpcStack.vpc,
  webS3Bucket: s3Stack.webS3Bucket
})
