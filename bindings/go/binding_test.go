package tree_sitter_type_ml_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_type_ml "github.com/mrapache/tree-sitter-type_ml/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_type_ml.Language())
	if language == nil {
		t.Errorf("Error loading TypeML grammar")
	}
}
