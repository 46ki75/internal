import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'

export class DynamoDBStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
      },
      ...props
    })

    // # --------------------------------------------------------------------------------
    //
    // JWT
    //
    // # --------------------------------------------------------------------------------

    const JWTTable = new dynamodb.Table(this, 'JWTTable', {
      tableName: 'jwt-keystore',
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING
      },
      timeToLiveAttribute: 'expireAt',
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    })
  }
}
