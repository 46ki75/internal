package dynamodb

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/dynamodb"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

type DynamoDbComponent struct {
	pulumi.ResourceState
}

type DynamoDbComponentArgs struct {
}

func NewDynamoDbComponent(
	ctx *pulumi.Context,
	name string,
	args *DynamoDbComponentArgs,
	opts ...pulumi.ResourceOption,
) (*DynamoDbComponent, error) {
	component := &DynamoDbComponent{}
	stackName := ctx.Stack()

	err := ctx.RegisterComponentResource("46ki75:component:DynamoDb", name, component, opts...)
	if err != nil {
		return nil, err
	}

	dynamodb.NewTable(
		ctx,
		fmt.Sprintf("%s-46ki75-internal-dynamodb-table-main", stackName),
		&dynamodb.TableArgs{
			Name: pulumi.StringPtr(
				fmt.Sprintf("%s-46ki75-internal-dynamodb-table", stackName),
			),
			ReadCapacity:  pulumi.IntPtr(3),
			WriteCapacity: pulumi.IntPtr(3),
			HashKey:       pulumi.StringPtr("PK"),
			RangeKey:      pulumi.StringPtr("SK"),
			Attributes: dynamodb.TableAttributeArray{
				dynamodb.TableAttributeArgs{
					Name: pulumi.String("PK"),
					Type: pulumi.String("S"),
				},
				dynamodb.TableAttributeArgs{
					Name: pulumi.String("SK"),
					Type: pulumi.String("S"),
				},
			},
			Ttl: dynamodb.TableTtlArgs{
				AttributeName: pulumi.String("_TTL"),
				Enabled:       pulumi.BoolPtr(true),
			},
			DeletionProtectionEnabled: pulumi.BoolPtr(true),
		},
		pulumi.Import(
			pulumi.ID(fmt.Sprintf("%s-46ki75-internal-dynamodb-table", stackName)),
		),
	)

	return component, nil
}
