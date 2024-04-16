import * as cdk from 'aws-cdk-lib'
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
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // S3 バケットの定義
    const bucket = new Bucket(this, 'VueJsBucket', {
      bucketName: 'internal-web',
      websiteIndexDocument: 'index.html',
      publicReadAccess: true
    })

    // CodeBuild プロジェクトの定義
    const buildProject = new PipelineProject(this, 'VueJsBuild', {
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['cd web', 'npm install']
          },
          build: {
            commands: ['cd web', 'npm run build']
          }
        },
        artifacts: {
          'base-directory': 'web/dist',
          files: ['**/*']
        }
      }),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_5_0
      }
    })

    // CodePipeline の定義
    const pipeline = new Pipeline(this, 'VueJsPipeline', {
      pipelineName: 'VueJsDeploymentPipeline',
      restartExecutionOnUpdate: true
    })

    // ソースステージの追加
    const sourceOutput = new Artifact('SourceOutput')
    const buildOutput = new Artifact('BuildOutput')
    const sourceAction = new CodeStarConnectionsSourceAction({
      actionName: 'GitHub_Source',
      owner: '46ki75',
      repo: 'internal',
      branch: 'main',
      connectionArn:
        'arn:aws:codestar-connections:ap-northeast-1:173800583470:connection/3e72361f-5175-4169-b25a-e0a2e4a37317',
      output: sourceOutput
    })
    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction]
    })

    // ビルドステージの追加
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

    // デプロイステージの追加
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
