/*/**
 * @file TypeML grammar for tree-sitter
 * @author Irisu <mrapacheee@gmail.com>
 * @license Apache-2.0
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "type_ml",

  extras: ($) => [/[\s\t\r\n]/, $.comment_multi, $.comment_line],

  conflicts: ($) => [[$.annotation]],

  rules: {
    source_file: ($) =>
      repeat(
        choice(
          $.use_directive,
          $.library_directive,
          $.group_definition,
          $.element_definition,
          $.enum_definition,
          $.expression_definition,
          $.expression_impl,
          $.struct_definition,
          $.struct_impl,
          $.element,
        ),
      ),

    comment_multi: ($) =>
      token(seq("/*", repeat(choice(/[^*]/, seq("*", /[^\/]/))), "*/")),
    comment_line: ($) => token(seq("//", repeat(/[^\n]/), /\n?/)),

    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,
    generic_identifier: ($) =>
      seq($.identifier, "<", $.full_type_identifier, ">"),
    full_type_identifier: ($) =>
      seq(
        field("module", repeat(seq(/[a-zA-Z_][a-zA-Z0-9_]*/, "::"))),
        choice(
          field("type", $.identifier),
          field("generic_type", $.generic_identifier),
        ),
      ),

    string: ($) => seq('"', /[^"]*/, '"'),
    array: ($) =>
      seq(
        "[",
        optional(
          seq(
            $.full_type_identifier,
            repeat(seq(",", $.full_type_identifier)),
            optional(","),
          ),
        ),
        "]",
      ),

    absolute_path: ($) => seq("<", /[^>]+/, ">"),
    relative_path: ($) => seq('"', /[^"]+/, '"'),
    use_directive: ($) =>
      seq(
        "#",
        "use",
        choice(
          field("absolute", $.absolute_path),
          field("relative", $.relative_path),
        ),
        "\n",
      ),

    library_directive: ($) => seq("#", "library", "\n"),

    annotation: ($) =>
      seq(
        "@",
        field("name", $.identifier),
        optional(field("value", $.field_value)),
      ),

    metadata: ($) =>
      seq(
        field("identifier", $.identifier),
        optional(field("value", seq("(", $.field_value, ")"))),
      ),
    metadata_list: ($) =>
      seq(
        "#",
        "[",
        $.metadata,
        repeat(seq(",", $.metadata)),
        optional(","),
        "]",
      ),

    group_keyword: ($) => "group",
    group_count: ($) =>
      seq(
        "(",
        choice(seq($.integer, "-", $.integer), $.integer, "*", "?", "+"),
        ")",
      ),
    group_bind: ($) =>
      seq(
        repeat($.annotation),
        "+",
        $.full_type_identifier,
        optional($.group_count),
      ),
    group_definition: ($) =>
      seq(
        repeat(choice($.metadata_list, $.annotation)),
        $.group_keyword,
        field("identifier", $.identifier),
        choice(seq("{", repeat($.group_bind), "}"), ";"),
      ),

    field_definition: ($) =>
      seq(
        repeat(choice($.metadata_list, $.annotation)),
        field("field_identifier", $.identifier),
        ":",
        field("field_type", $.full_type_identifier),
      ),
    fields_definition: ($) =>
      seq(
        $.field_definition,
        repeat(seq(",", $.field_definition)),
        optional(","),
      ),

    element_keyword: ($) => "element",
    element_definition: ($) =>
      seq(
        repeat(choice($.metadata_list, $.annotation)),
        $.element_keyword,
        field("identifier", $.identifier),
        "-",
        ">",
        field("bind", $.full_type_identifier),
        choice(seq("{", $.fields_definition, "}"), ";"),
      ),

    enum_keyword: ($) => "enum",
    enum_variant: ($) =>
      seq(
        repeat(choice($.metadata_list, $.annotation)),
        field("identifier", $.identifier),
        optional(seq("(", field("inner_type", $.full_type_identifier), ")")),
      ),
    enum_variants: ($) =>
      seq($.enum_variant, repeat(seq(",", $.enum_variant)), optional(",")),
    enum_definition: ($) =>
      seq(
        repeat(choice($.metadata_list, $.annotation)),
        $.enum_keyword,
        field("identifier", $.identifier),
        choice(seq("{", $.enum_variants, "}"), ";"),
      ),

    struct_keyword: ($) => "struct",
    struct_definition: ($) =>
      seq(
        repeat(choice($.metadata_list, $.annotation)),
        $.struct_keyword,
        field("identifier", $.identifier),
        choice(seq("{", $.fields_definition, "}"), ";"),
      ),
    struct_impl_keyword: ($) => seq("$", "struct"),
    struct_impl: ($) =>
      seq(
        $.struct_impl_keyword,
        field("identifier", $.identifier),
        $.impl_bind_operator,
        field("bind", $.full_type_identifier),
        "{",
        field("fields", $.fields_impl),
        "}",
      ),

    expression_keyword: ($) => "expression",
    expression_definition: ($) =>
      seq(
        repeat(choice($.metadata_list, $.annotation)),
        $.expression_keyword,
        field("identifier", $.identifier),
        choice(seq("{", $.fields_definition, "}"), ";"),
      ),

    impl_bind_operator: ($) => seq("-", ">"),
    expression_impl_keyword: ($) => seq("$", "expr"),
    expression_impl: ($) =>
      seq(
        $.expression_impl_keyword,
        field("identifier", $.identifier),
        $.impl_bind_operator,
        field("bind", $.full_type_identifier),
        "{",
        optional(field("fields", $.fields_impl)),
        "}",
      ),

    integer: ($) => /-?[0-9]+/,
    float: ($) => /-?[0-9]+\.[0-9]*/,
    boolean: ($) => choice("true", "false"),
    enum_variant_value: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,
    custom_enum_variant_value: ($) => /[^"${}\[\],\/=> \s\t\r\n]+/,

    list: ($) =>
      seq(
        "[",
        $.field_value,
        repeat(seq(",", $.field_value)),
        optional(","),
        "]",
      ),

    impl_ref: ($) =>
      seq(field("operator", "$"), field("identifier", $.identifier)),

    field_value: ($) =>
      choice(
        $.boolean,
        $.float,
        $.integer,
        $.string,
        $.enum_variant_value,
        $.custom_enum_variant_value,
        $.list,
        //$.impl_ref,
      ),

    field_impl: ($) =>
      seq(
        field("field_identifier", $.identifier),
        ":",
        field("field_value", $.field_value),
      ),
    fields_impl: ($) =>
      seq($.field_impl, repeat(seq(",", $.field_impl)), optional(",")),

    expression_inline_impl: ($) =>
      seq("{", $.full_type_identifier, $.fields_impl, "}"),
    struct_inline_impl: ($) => seq("{{", $.fields_impl, "}}"),

    attribute_value: ($) =>
      choice(
        $.boolean,
        $.float,
        $.integer,
        $.string,
        $.enum_variant_value,
        $.custom_enum_variant_value,
        $.list,
        $.impl_ref,
        $.expression_inline_impl,
        $.struct_inline_impl,
      ),
    attribute: ($) =>
      seq(
        field("identifier", $.identifier),
        "=",
        field("value", $.attribute_value),
      ),

    alias_operator: ($) => "@",
    alias: ($) => seq($.alias_operator, $.identifier),
    empty_tag: ($) =>
      seq(
        "<",
        field("empty_tag", $.full_type_identifier),
        optional($.alias),
        repeat($.attribute),
        "/>",
      ),

    tag: ($) =>
      seq(
        "<",
        field("open_tag", $.full_type_identifier),
        optional($.alias),
        repeat($.attribute),
        ">",
        repeat($.element),
        "</",
        field("close_tag", $.full_type_identifier),
        ">",
      ),

    element: ($) => choice($.empty_tag, $.tag),
  },
});
