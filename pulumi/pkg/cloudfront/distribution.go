package cloudfront

import (
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/acm"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudfront"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

type CloudfrontDistributionComponent struct {
	pulumi.ResourceState
	CloudfrontDistribution *cloudfront.Distribution
}

type CloudfrontDistributionComponentArgs struct {
	S3Bucket                      *s3.BucketV2
	CloudfrontOriginAccessControl *cloudfront.OriginAccessControl
	CloudfrontFunction            *cloudfront.Function
	CloudfrontCertificate         *acm.Certificate
}

func NewCloudfrontDistributionComponent(
	ctx *pulumi.Context,
	name string,
	args *CloudfrontDistributionComponentArgs,
	opts ...pulumi.ResourceOption,
) (*CloudfrontDistributionComponent, error) {
	component := &CloudfrontDistributionComponent{}

	err := ctx.RegisterComponentResource("46ki75:component:CloudfrontDistribution", name, component, opts...)
	if err != nil {
		return nil, err
	}

	stackName := ctx.Stack()

	var domainName string

	if stackName == "prod" {
		domainName = "internal.46ki75.com"
	} else {
		domainName = stackName + "-internal.46ki75.com"
	}

	const s3OriginId = "web"

	component.CloudfrontDistribution, err = cloudfront.NewDistribution(
		ctx,
		stackName+"-46ki75-examples-cloudfront-distribution-main",
		&cloudfront.DistributionArgs{
			HttpVersion: pulumi.String("http2and3"),
			Origins: cloudfront.DistributionOriginArray{
				&cloudfront.DistributionOriginArgs{
					DomainName:            args.S3Bucket.BucketRegionalDomainName,
					OriginAccessControlId: args.CloudfrontOriginAccessControl.ID(),
					OriginId:              pulumi.String(s3OriginId),
				},
			},
			Aliases: pulumi.StringArray{
				pulumi.String(domainName),
			},
			Enabled:       pulumi.Bool(true),
			IsIpv6Enabled: pulumi.Bool(true),
			DefaultCacheBehavior: &cloudfront.DistributionDefaultCacheBehaviorArgs{
				AllowedMethods: pulumi.StringArray{
					pulumi.String("DELETE"),
					pulumi.String("GET"),
					pulumi.String("HEAD"),
					pulumi.String("OPTIONS"),
					pulumi.String("PATCH"),
					pulumi.String("POST"),
					pulumi.String("PUT"),
				},
				CachedMethods: pulumi.StringArray{
					pulumi.String("GET"),
					pulumi.String("HEAD"),
				},
				TargetOriginId: pulumi.String(s3OriginId),
				ForwardedValues: &cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs{
					QueryString: pulumi.Bool(false),
					Cookies: &cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs{
						Forward: pulumi.String("none"),
					},
				},
				ViewerProtocolPolicy: pulumi.String("allow-all"),
				MinTtl:               pulumi.Int(0),
				DefaultTtl:           pulumi.Int(3600),
				MaxTtl:               pulumi.Int(86400),
				FunctionAssociations: cloudfront.DistributionDefaultCacheBehaviorFunctionAssociationArray{
					&cloudfront.DistributionDefaultCacheBehaviorFunctionAssociationArgs{
						EventType: pulumi.String("viewer-request"),
						FunctionArn: args.CloudfrontFunction.Arn.ApplyT(func(arn string) string {
							return arn
						}).(pulumi.StringOutput),
					},
				},
			},
			Restrictions: &cloudfront.DistributionRestrictionsArgs{
				GeoRestriction: &cloudfront.DistributionRestrictionsGeoRestrictionArgs{
					RestrictionType: pulumi.String("none"),
				},
			},
			ViewerCertificate: &cloudfront.DistributionViewerCertificateArgs{
				CloudfrontDefaultCertificate: pulumi.Bool(false),
				AcmCertificateArn:            args.CloudfrontCertificate.Arn,
				SslSupportMethod:             pulumi.StringPtr("sni-only"),
				MinimumProtocolVersion:       pulumi.StringPtr("TLSv1.2_2021"),
			},
			DefaultRootObject: pulumi.String("index.html"),
		})

	if err != nil {
		return nil, err
	}

	return component, nil
}
