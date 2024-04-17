#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { ApiStack } from '../lib/api'
import { CloudFrontStack } from '../lib/cloudfront'
import { WebCodePipelineStack } from '../lib/webpipeline'

const app = new cdk.App()

const apiStack = new ApiStack(app, 'internal-api')
const cloudfrontStack = new CloudFrontStack(app, 'internal-cloudfront')
const webCodePipelineStack = new WebCodePipelineStack(
  app,
  'internal-web-codepipeline'
)

cloudfrontStack.node.addDependency(apiStack)
cloudfrontStack.node.addDependency(webCodePipelineStack)
