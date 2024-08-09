import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

import * as events from 'aws-cdk-lib/aws-events'
import * as target from 'aws-cdk-lib/aws-events-targets'
import * as lambda from 'aws-cdk-lib/aws-lambda'

interface EventBridgeStackProps extends cdk.StackProps {
  generateJwtSecretLambdaFunction: lambda.Function
  generateJwtSecretLambdaAlias: lambda.Alias
}

export class EventBridgeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EventBridgeStackProps) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
      },
      ...props
    })

    new events.Rule(this, 'AccessSecret', {
      ruleName: 'generate-access-jwt-secret',
      schedule: events.Schedule.cron({ minute: '0', hour: '3' }),
      targets: [
        new target.LambdaFunction(props.generateJwtSecretLambdaAlias, {
          event: events.RuleTargetInput.fromObject({ kind: 'access_token' })
        })
      ]
    })

    new events.Rule(this, 'RefreshSecret', {
      ruleName: 'generate-refresh-jwt-secret',
      schedule: events.Schedule.cron({ minute: '0', hour: '3' }),
      targets: [
        new target.LambdaFunction(props.generateJwtSecretLambdaAlias, {
          event: events.RuleTargetInput.fromObject({ kind: 'refresh_token' })
        })
      ]
    })
  }
}
