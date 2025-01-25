package acm

import (
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/acm"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

type AcmCloudfrontComponent struct {
	pulumi.ResourceState
	CloudfrontCertificate *acm.Certificate
}

type AcmCloudfrontComponentArgs struct {
}

func NewAcmCloudfrontComponent(
	ctx *pulumi.Context,
	name string,
	args *AcmCloudfrontComponentArgs,
	opts ...pulumi.ResourceOption,
) (*AcmCloudfrontComponent, error) {
	component := &AcmCloudfrontComponent{}
	stackName := ctx.Stack()

	err := ctx.RegisterComponentResource("46ki75:component:AcmCloudfront", name, component, opts...)
	if err != nil {
		return nil, err
	}

	var domainName string

	if stackName == "prod" {
		domainName = "internal.46ki75.com"
	} else {
		domainName = stackName + "-internal.46ki75.com"
	}

	usEastProvider, err := aws.NewProvider(
		ctx,
		"UsEastProvider",
		&aws.ProviderArgs{
			Region: pulumi.String("us-east-1"),
		})
	if err != nil {
		return nil, err
	}

	component.CloudfrontCertificate, err =
		acm.NewCertificate(
			ctx,
			stackName+"-46ki75-internal-acm-certificate-cloudfront",
			&acm.CertificateArgs{
				DomainName:       pulumi.StringPtr(domainName),
				ValidationMethod: pulumi.StringPtr("DNS"),
				ValidationOptions: acm.CertificateValidationOptionArray{
					&acm.CertificateValidationOptionArgs{
						DomainName:       pulumi.String(domainName),
						ValidationDomain: pulumi.String(domainName),
					},
				},
			},
			pulumi.Provider(usEastProvider),
		)
	if err != nil {
		return nil, err
	}

	// component.CloudfrontCertificateValidation, err =
	// 	acm.NewCertificateValidation(
	// 		ctx,
	// 		stackName+"-46ki75-internal-acm-certificate_validation-cloudfront",
	// 		&acm.CertificateValidationArgs{
	// 			CertificateArn: component.CloudfrontCertificate.Arn,
	// 			ValidationRecordFqdns: pulumi.StringArray{
	// 				pulumi.String(domainName),
	// 			},
	// 		},
	// 		pulumi.Provider(usEastProvider),
	// 	)
	// if err != nil {
	// 	return nil, err
	// }

	return component, nil
}
