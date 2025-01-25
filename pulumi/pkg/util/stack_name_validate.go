package util

import (
	"fmt"
	"strings"
)

var allowedStackNames = []string{
	"dev",
	"stg",
	"prod",
}

func ValidateStackName(stackName string) error {

	var isValidStackName bool
	for _, allowedStackName := range allowedStackNames {
		if stackName == allowedStackName {
			isValidStackName = true
		}
	}

	if !isValidStackName {
		return fmt.Errorf(
			"invalid stack name: %s. Allowed values are: %s",
			stackName,
			strings.Join(allowedStackNames, ", "),
		)
	}

	return nil
}
