#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { ApiStack } from '../lib/api'
import { WebCodePipelineStack } from '../lib/webpipeline'
import { ApiCodePipelineStack } from '../lib/apipipeline'
import { Route53Stack } from '../lib/route53'

const app = new cdk.App()

const route53Stack = new Route53Stack(app, 'route53')

const apiStack = new ApiStack(app, 'api')
const webCodePipelineStack = new WebCodePipelineStack(app, 'webpipeline')

const apiCodePipelineStack = new ApiCodePipelineStack(app, 'apipipeline')

webCodePipelineStack.addDependency(apiStack)
apiCodePipelineStack.addDependency(apiStack)
