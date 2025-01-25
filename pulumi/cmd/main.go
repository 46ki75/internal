package main

import (
	"internal/pkg/acm"
	"internal/pkg/cloudfront"
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

		acmCloudfrontComponent, err := acm.NewAcmCloudfrontComponent(
			ctx,
			"AcmCloudfrontComponent",
			&acm.AcmCloudfrontComponentArgs{},
		)
		if err != nil {
			return err
		}

		route53ZoneComponent, err := route53.NewRoute53ZoneComponent(
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

		s3BucketComponent, err := s3.NewS3BucketComponent(
			ctx,
			"S3BucketComponent",
			&s3.S3BucketComponentArgs{},
		)
		if err != nil {
			return err
		}

		cloudfrontFunctionComponent, err := cloudfront.NewCloudfrontFunctionComponent(
			ctx,
			"CloudfrontFunctionComponent",
			&cloudfront.CloudfrontFunctionComponentArgs{},
		)
		if err != nil {
			return err
		}

		originAccessControlComponent, err := cloudfront.NewOriginAccessControlComponent(
			ctx,
			"OriginAccessControlComponent",
			&cloudfront.OriginAccessControlComponentArgs{},
		)
		if err != nil {
			return err
		}

		cloudfrontDistributionComponent, err :=
			cloudfront.NewCloudfrontDistributionComponent(
				ctx,
				"CloudfrontDistributionComponent",
				&cloudfront.CloudfrontDistributionComponentArgs{
					S3Bucket:                      s3BucketComponent.S3Bucket,
					CloudfrontOriginAccessControl: originAccessControlComponent.CloudfrontOriginAccessControl,
					CloudfrontFunction:            cloudfrontFunctionComponent.CloudfrontFunction,
					CloudfrontCertificate:         acmCloudfrontComponent.CloudfrontCertificate,
				},
			)
		if err != nil {
			return err
		}

		_, err = route53.NewRoute53CloudfrontRecordComponent(
			ctx,
			"Route53CloudfrontRecordComponent",
			&route53.Route53CloudfrontRecordComponentArgs{
				Route53Zone:            route53ZoneComponent.Route53Zone,
				CloudfrontDistribution: cloudfrontDistributionComponent.CloudfrontDistribution,
				CloudfrontCertificate:  acmCloudfrontComponent.CloudfrontCertificate,
			},
			pulumi.DependsOn(
				[]pulumi.Resource{
					cloudfrontDistributionComponent,
				},
			),
		)
		if err != nil {
			return err
		}

		_, err =
			s3.NewS3BucketPolicyComponent(
				ctx,
				"S3BucketPolicyComponent",
				&s3.S3BucketPolicyComponentArgs{
					S3Bucket:               s3BucketComponent.S3Bucket,
					CloudFrontDistribution: cloudfrontDistributionComponent.CloudfrontDistribution,
				},
			)
		if err != nil {
			return err
		}

		return nil
	})
}
