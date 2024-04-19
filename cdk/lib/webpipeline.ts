import * as cdk from 'aws-cdk-lib'
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront'
import {
  PipelineProject,
  BuildSpec,
  LinuxBuildImage
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
import { Construct } from 'constructs'

export class WebCodePipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'ap-northeast-1'
      },
      ...props
    })

    // # --------------------------------------------------
    //
    // S3
    //
    // # --------------------------------------------------

    const bucket = new Bucket(this, 'VueJsBucket', {
      bucketName: '46ki75-internal-web-frontend',
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: '404.html',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      publicReadAccess: true
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
            commands: ['cd web', 'npm install']
          },
          build: {
            commands: ['npm run build']
          }
        },
        artifacts: {
          'base-directory': 'web/dist',
          files: ['**/*']
        }
      }),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_7_0
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
      connectionArn:
        'arn:aws:codestar-connections:ap-northeast-1:173800583470:connection/01765c3a-868a-4a7b-b517-f86fee05274a',
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
          bucket: bucket,
          input: buildOutput
        })
      ]
    })
  }
}
