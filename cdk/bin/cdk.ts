#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { ApiStack } from '../lib/api'
import { CloudFrontStack } from '../lib/cloudfront'

const app = new cdk.App()
new ApiStack(app, 'internal-serverless-api-api')
new CloudFrontStack(app, 'internal-serverless-api-cloudfront')
