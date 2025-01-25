package main

import (
	"internal/pkg/route53"
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

		return nil
	})
}
