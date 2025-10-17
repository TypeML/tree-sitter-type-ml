/**
 * @file TypeML grammar for tree-sitter
 * @author Irisu <mrapacheee@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "type_ml",

  extras: ($) => [/[\s\t\r\n]/, $.comment_multi, $.comment_line],

  conflicts: ($) => [],

  rules: {
    source_file: ($) =>
      repeat(choice($.directive, $.struct_impl, $.expr_impl, $.element)),

    comment_multi: ($) =>
      token(seq("/*", repeat(choice(/[^*]/, seq("*", /[^\/]/))), "*/")),

    comment_line: ($) => token(seq("//", repeat(/[^\n]/), /\n?/)),

    integer: ($) => /-?[0-9]+/,
    float: ($) => /-?[0-9]+\.[0-9]*/,
    boolean: ($) => choice("true", "false"),
    string: ($) => seq('"', /[^"]*/, '"'),
    enum: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,
    custom_enum: ($) => /[^"{}\[\],\/=> \s\t\r\n]+/,

    directive: ($) =>
      prec.right(
        1,
        seq(
          "#",
          field("name", /[a-zA-Z0-9_]+/),
          optional(choice($.absolute_path, $.relative_path, $.constant)),
          "\n",
        ),
      ),

    absolute_path: ($) => seq("<", /[^>]+/, ">"),
    relative_path: ($) => seq('"', /[^"]+/, '"'),
    constant: ($) => /[a-zA-Z0-9_]+/,

    bind_operator: ($) => seq("-", ">"),

    full_type_identifier: ($) =>
      seq(repeat(seq(/[a-zA-Z_][a-zA-Z0-9_]*/, "::")), $.type_identifier),
    type_identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,
    field_identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    struct_field_value: ($) =>
      choice($.boolean, $.float, $.integer, $.string, $.enum, $.custom_enum),
    struct_field: ($) => seq($.field_identifier, ":", $.struct_field_value),
    struct_fields: ($) =>
      seq($.struct_field, repeat(seq(",", $.struct_field)), optional(",")),
    struct_impl_keyword: ($) => seq("$", "struct"),
    struct_impl: ($) =>
      seq(
        $.struct_impl_keyword,
        $.type_identifier,
        $.bind_operator,
        $.full_type_identifier,
        "{",
        field("fields", $.struct_fields),
        "}",
      ),

    list: ($) =>
      seq(
        "[",
        $.expr_field_value,
        repeat(seq(",", $.expr_field_value)),
        optional(","),
        "]",
      ),
    expr_field_value: ($) =>
      choice(
        $.boolean,
        $.float,
        $.integer,
        $.string,
        $.enum,
        $.custom_enum,
        $.list,
      ),
    expr_field: ($) => seq($.field_identifier, ":", $.expr_field_value),
    expr_fields: ($) =>
      seq($.expr_field, repeat(seq(",", $.expr_field)), optional(",")),
    expr_impl_keyword: ($) => seq("$", "expr"),
    expr_impl: ($) =>
      seq(
        $.expr_impl_keyword,
        $.type_identifier,
        $.bind_operator,
        $.full_type_identifier,
        "{",
        optional(field("fields", $.expr_fields)),
        "}",
      ),

    impl_operator: ($) => "$",
    impl_ref: ($) => seq($.impl_operator, $.type_identifier),
    expr: ($) =>
      seq(
        "{",
        choice(seq($.full_type_identifier, $.expr_fields), $.impl_ref),
        "}",
      ),
    struct: ($) => seq("{{", choice($.struct_fields, $.impl_ref), "}}"),

    attribute_value: ($) =>
      choice(
        $.boolean,
        $.float,
        $.integer,
        $.string,
        $.enum,
        $.custom_enum,
        $.expr,
        $.struct,
      ),
    attribute: ($) => seq($.field_identifier, "=", $.attribute_value),

    alias_operator: ($) => "@",
    alias: ($) => seq($.alias_operator, $.type_identifier),
    empty_tag: ($) =>
      seq(
        "<",
        $.full_type_identifier,
        optional($.alias),
        repeat($.attribute),
        "/>",
      ),

    tag: ($) =>
      seq(
        "<",
        $.full_type_identifier,
        optional($.alias),
        repeat($.attribute),
        ">",
        repeat($.element),
        "</",
        $.full_type_identifier,
        ">",
      ),

    element: ($) => choice($.empty_tag, $.tag),
  },
});
