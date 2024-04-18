#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { ApiStack } from '../lib/api'
import { WebCodePipelineStack } from '../lib/webpipeline'
import { ApiCodePipelineStack } from '../lib/apipipeline'

const app = new cdk.App()

const apiStack = new ApiStack(app, 'internal-api')
const webCodePipelineStack = new WebCodePipelineStack(
  app,
  'internal-web-pipeline'
)

const apiCodePipelineStack = new ApiCodePipelineStack(
  app,
  'internal-api-pipeline'
)

webCodePipelineStack.addDependency(apiStack)
apiCodePipelineStack.addDependency(apiStack)
