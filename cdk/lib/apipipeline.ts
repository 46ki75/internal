import * as cdk from 'aws-cdk-lib'
import {
  PipelineProject,
  BuildSpec,
  LinuxBuildImage,
  ComputeType,
  LinuxLambdaBuildImage
} from 'aws-cdk-lib/aws-codebuild'
import {
  LambdaDeploymentConfig,
  LambdaDeploymentGroup
} from 'aws-cdk-lib/aws-codedeploy'
import { Pipeline, Artifact } from 'aws-cdk-lib/aws-codepipeline'
import {
  CodeBuildAction,
  CodeDeployServerDeployAction,
  CodeStarConnectionsSourceAction
} from 'aws-cdk-lib/aws-codepipeline-actions'
import {
  CompositePrincipal,
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal
} from 'aws-cdk-lib/aws-iam'
import { Alias, Function, Version } from 'aws-cdk-lib/aws-lambda'
import { Construct } from 'constructs'

export class ApiCodePipelineStack extends cdk.Stack {
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
    // IAM
    //
    // # --------------------------------------------------

    const buildRole = new Role(this, 'CodeDeployLamdaRole', {
      assumedBy: new ServicePrincipal('codebuild.amazonaws.com')
    })

    buildRole.addToPolicy(
      new PolicyStatement({
        actions: ['lambda:UpdateFunctionCode'],
        resources: [
          `arn:aws:lambda:ap-northeast-1:${cdk.Stack.of(this).account}:function:internal-api`
        ],
        effect: Effect.ALLOW
      })
    )

    // # --------------------------------------------------
    //
    // CodePipeline
    //
    // # --------------------------------------------------

    const pipeline = new Pipeline(this, 'NitroPipeline', {
      pipelineName: 'internal-web-api',
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
        'arn:aws:codestar-connections:ap-northeast-1:891377368344:connection/c73bd5de-f670-423f-a2d2-96ec0728ea48',
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

    const buildProject = new PipelineProject(this, 'NitroBuild', {
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: ['cd nitro', 'npm i -g npm@latest', 'npm ci']
          },
          build: {
            commands: ['npm run build']
          },
          post_build: {
            commands: [
              'cd .output/server',
              'zip -r /tmp/lambda.zip .',
              'aws lambda update-function-code --function-name internal-api --zip-file fileb:///tmp/lambda.zip'
            ]
          }
        },
        artifacts: {
          'base-directory': 'nitro/.output/server',
          files: ['**/*']
        }
      }),
      environment: {
        computeType: ComputeType.LAMBDA_1GB,
        buildImage: LinuxLambdaBuildImage.AMAZON_LINUX_2023_NODE_20
      },
      role: buildRole
    })

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
  }
}
