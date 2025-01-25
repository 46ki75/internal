package route53

import (
	"errors"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/acm"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudfront"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/route53"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

type Route53CloudfrontRecordComponent struct {
	pulumi.ResourceState
}

type Route53CloudfrontRecordComponentArgs struct {
	Route53Zone            *route53.LookupZoneResult
	CloudfrontDistribution *cloudfront.Distribution
	CloudfrontCertificate  *acm.Certificate
}

func NewRoute53CloudfrontRecordComponent(
	ctx *pulumi.Context,
	name string,
	args *Route53CloudfrontRecordComponentArgs,
	opts ...pulumi.ResourceOption,
) (*Route53CloudfrontRecordComponent, error) {
	component := &Route53CloudfrontRecordComponent{}
	stackName := ctx.Stack()

	// Check for nil arguments
	if args == nil {
		return nil, errors.New("Route53CloudfrontRecordComponentArgs cannot be nil")
	}
	if args.Route53Zone == nil {
		return nil, errors.New("Route53Zone cannot be nil")
	}
	// if args.CloudfrontDistribution == nil {
	// 	return nil, errors.New("CloudfrontDistribution cannot be nil")
	// }
	if args.CloudfrontCertificate == nil {
		return nil, errors.New("CloudfrontCertificate cannot be nil")
	}

	err := ctx.RegisterComponentResource("46ki75:component:Route53CloudfrontRecord", name, component, opts...)
	if err != nil {
		return nil, err
	}

	var domainName string
	if stackName == "prod" {
		domainName = "internal.46ki75.com"
	} else {
		domainName = stackName + "-internal.46ki75.com"
	}

	_, err = route53.NewRecord(
		ctx,
		stackName+"-46ki75-internal-route53-record-cloudfront",
		&route53.RecordArgs{
			ZoneId: pulumi.String(args.Route53Zone.ZoneId),
			Name:   pulumi.String(domainName),
			Type:   pulumi.String("A"),
			Aliases: route53.RecordAliasArray{
				route53.RecordAliasArgs{
					Name: args.CloudfrontDistribution.DomainName.ApplyT(func(s string) string {
						return s
					}).(pulumi.StringOutput),
					ZoneId: args.CloudfrontDistribution.HostedZoneId.ApplyT(func(s string) string {
						return s
					}).(pulumi.StringOutput),
					EvaluateTargetHealth: pulumi.Bool(false),
				},
			},
		},
		opts...,
	)
	if err != nil {
		return nil, err
	}

	args.CloudfrontCertificate.DomainValidationOptions.ApplyT(func(options []acm.CertificateDomainValidationOption) error {
		if options == nil {
			return errors.New("DomainValidationOptions is nil")
		}
		for _, option := range options {
			_, err := route53.NewRecord(
				ctx,
				stackName+"-46ki75-internal-route53-record-cloudfront-acm_"+*option.DomainName,
				&route53.RecordArgs{
					ZoneId: pulumi.String(args.Route53Zone.ZoneId),
					Name:   pulumi.String(*option.ResourceRecordName),
					Type:   pulumi.String(*option.ResourceRecordType),
					Records: pulumi.StringArray{
						pulumi.String(*option.ResourceRecordValue),
					},
					Ttl: pulumi.IntPtr(300),
				},
				opts...,
			)
			if err != nil {
				return err
			}
		}
		return nil
	})

	return component, nil
}
