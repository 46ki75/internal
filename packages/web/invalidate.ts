import {
  CloudFrontClient,
  ListDistributionsCommand,
  CreateInvalidationCommand
} from '@aws-sdk/client-cloudfront'

const ENVIRONMENT = process.env.ENVIRONMENT

if (ENVIRONMENT == null || !['dev', 'stg', 'prd'].includes(ENVIRONMENT)) {
  throw new Error('Invalid ENVIRONMENT')
}

console.log('ENVIRONMENT:', ENVIRONMENT)

const client = new CloudFrontClient({ region: 'ap-northeast-1' })

const { DistributionList } = await client.send(new ListDistributionsCommand())

const distributionId = DistributionList?.Items?.find((distribution) =>
  distribution.Aliases?.Items?.includes(
    ENVIRONMENT === 'prod'
      ? 'internal.46ki75.com'
      : `${ENVIRONMENT}.internal.46ki75.com`
  )
)?.Id

if (distributionId == null) {
  throw new Error('Distribution not found')
}

const { Invalidation } = await client.send(
  new CreateInvalidationCommand({
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: Date.now().toString(),
      Paths: {
        Quantity: 1,
        Items: ['/*']
      }
    }
  })
)

console.log('Invalidate CloudFront Distribution:', Invalidation?.Id)
console.log(Invalidation)
