package route53

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/route53"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

type Route53ZoneComponent struct {
	pulumi.ResourceState
	Route53Zone *route53.LookupZoneResult
}

type Route53ZoneComponentArgs struct {
}

func NewRoute53ZoneComponent(
	ctx *pulumi.Context,
	name string,
	args *Route53ZoneComponentArgs,
	opts ...pulumi.ResourceOption,
) (*Route53ZoneComponent, error) {
	component := &Route53ZoneComponent{}

	err := ctx.RegisterComponentResource("46ki75:component:Route53Zone", name, component, opts...)
	if err != nil {
		return nil, err
	}

	stackName := ctx.Stack()
	var zoneName string

	if stackName == "prod" {
		zoneName = "internal.46ki75.com"
	} else {
		zoneName = fmt.Sprintf("%v-internal.46ki75.com", stackName)
	}

	component.Route53Zone, err = route53.LookupZone(
		ctx,
		&route53.LookupZoneArgs{
			Name: &zoneName,
		},
	)
	if err != nil {
		return nil, err
	}

	return component, nil
}
