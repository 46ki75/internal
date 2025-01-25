package main

import (
	"internal/pkg/dynamodb"
	"internal/pkg/route53"
	"internal/pkg/s3"
	"internal/pkg/util"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {

		err := util.ValidateStackName(ctx.Stack())
		if err != nil {
			return err
		}

		_, err = route53.NewRoute53ZoneComponent(
			ctx,
			"Route53ZoneComponent",
			&route53.Route53ZoneComponentArgs{},
		)
		if err != nil {
			return err
		}

		_, err = dynamodb.NewDynamoDbComponent(
			ctx,
			"DynamoDbComponent",
			&dynamodb.DynamoDbComponentArgs{},
		)
		if err != nil {
			return err
		}

		_, err = s3.NewS3BucketComponent(
			ctx,
			"S3BucketComponent",
			&s3.S3BucketComponentArgs{},
		)
		if err != nil {
			return err
		}

		return nil
	})
}
