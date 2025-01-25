package s3

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/s3"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

type S3BucketComponent struct {
	pulumi.ResourceState
	S3Bucket *s3.BucketV2
}

type S3BucketComponentArgs struct {
}

func NewS3BucketComponent(
	ctx *pulumi.Context,
	name string,
	args *S3BucketComponentArgs,
	opts ...pulumi.ResourceOption,
) (*S3BucketComponent, error) {
	component := &S3BucketComponent{}
	stackName := ctx.Stack()

	err := ctx.RegisterComponentResource(
		"46ki75:component:S3Bucket",
		name, component, opts...,
	)
	if err != nil {
		return nil, err
	}

	component.S3Bucket, err = s3.NewBucketV2(
		ctx,
		fmt.Sprintf("%s-46ki75-internal-s3-bucket-web", stackName),
		&s3.BucketV2Args{
			Bucket: pulumi.StringPtr(
				fmt.Sprintf("%s-46ki75-internal-s3-bucket-web", stackName),
			),
		},
	)
	if err != nil {
		return nil, err
	}

	return component, nil
}
