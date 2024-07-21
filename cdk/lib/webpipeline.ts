import * as cdk from 'aws-cdk-lib'
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront'
import {
  PipelineProject,
  BuildSpec,
  LinuxBuildImage,
  LinuxLambdaBuildImage,
  ComputeType
} from 'aws-cdk-lib/aws-codebuild'
import { Pipeline, Artifact } from 'aws-cdk-lib/aws-codepipeline'
import {
  CodeCommitSourceAction,
  CodeBuildAction,
  S3DeployAction,
  CodeStarConnectionsSourceAction
} from 'aws-cdk-lib/aws-codepipeline-actions'
import {
  ArnPrincipal,
  CanonicalUserPrincipal,
  Effect,
  PolicyStatement,
  ServicePrincipal
} from 'aws-cdk-lib/aws-iam'
import {
  BlockPublicAccess,
  Bucket,
  BucketAccessControl
} from 'aws-cdk-lib/aws-s3'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { Construct } from 'constructs'

interface ApiStackProps extends cdk.StackProps {
  webS3Bucket: Bucket
}

export class WebCodePipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
      },
      ...props
    })

    // # --------------------------------------------------
    //
    // CodeBuild
    //
    // # --------------------------------------------------

    const buildProject = new PipelineProject(this, 'VueJsBuild', {
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['cd web', 'npm i -g npm@latest', 'npm ci']
          },
          build: {
            commands: ['npm run generate']
          }
        },
        artifacts: {
          'base-directory': 'web/dist',
          files: ['**/*']
        }
      }),
      environment: {
        computeType: ComputeType.LAMBDA_1GB,
        buildImage: LinuxLambdaBuildImage.AMAZON_LINUX_2023_NODE_20
      }
    })

    // # --------------------------------------------------
    //
    // CodePipeline
    //
    // # --------------------------------------------------

    const pipeline = new Pipeline(this, 'VueJsPipeline', {
      pipelineName: 'internal-web-frontend',
      restartExecutionOnUpdate: true
    })

    // # --------------------------------------------------
    //
    // Source
    //
    // # --------------------------------------------------

    const sourceOutput = new Artifact('SourceOutput')
    const buildOutput = new Artifact('BuildOutput')
    const sourceAction = new CodeStarConnectionsSourceAction({
      actionName: 'GitHub_Source',
      owner: '46ki75',
      repo: 'internal',
      branch: 'main',
      connectionArn: StringParameter.fromStringParameterName(
        this,
        'connectionArn',
        '/internal/web/prod/codestar/connection/arn'
      ).stringValue,
      output: sourceOutput
    })
    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction]
    })

    // # --------------------------------------------------
    //
    // CodeBuild
    //
    // # --------------------------------------------------

    const buildStage = pipeline.addStage({
      stageName: 'Build',
      actions: [
        new CodeBuildAction({
          actionName: 'CodeBuild',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput]
        })
      ]
    })

    // # --------------------------------------------------
    //
    // CodeDeploy
    //
    // # --------------------------------------------------

    const deployStage = pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new S3DeployAction({
          actionName: 'S3Deploy',
          bucket: props?.webS3Bucket,
          input: buildOutput
        })
      ]
    })
  }
}
