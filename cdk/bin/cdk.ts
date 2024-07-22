#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { ApiStack } from '../lib/api'
import { WebCodePipelineStack } from '../lib/webpipeline'
import { ApiCodePipelineStack } from '../lib/apipipeline'
import { Route53Stack } from '../lib/route53'
import { LambdaStack } from '../lib/lambda'
import { VPCStack } from '../lib/vpc'

const app = new cdk.App()

const vpcStack = new VPCStack(app, 'vpc')

const lambdaStack = new LambdaStack(app, 'lambda')

const route53Stack = new Route53Stack(app, 'route53')

const apiStack = new ApiStack(app, 'api', {
  hostedZone: route53Stack.hostedZone,
  apiLambdaFunction: lambdaStack.apiLambdaFunction,
  apiLambdaAlias: lambdaStack.apiLambdaAlias,
  vpc: vpcStack.vpc
})

const webCodePipelineStack = new WebCodePipelineStack(app, 'webpipeline', {
  webS3Bucket: apiStack.webS3Bucket
})

const apiCodePipelineStack = new ApiCodePipelineStack(app, 'apipipeline', {
  apiLambdaFunction: lambdaStack.apiLambdaFunction
})
