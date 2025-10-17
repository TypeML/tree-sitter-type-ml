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
    custom_enum: ($) => /[^"${}\[\],\/=> \s\t\r\n]+/,

    directive: ($) =>
      prec.right(
        1,
        seq(
          "#",
          field("name", /[a-zA-Z0-9_]+/),
          field(
            "value",
            optional(choice($.absolute_path, $.relative_path, $.constant)),
          ),
          "\n",
        ),
      ),

    absolute_path: ($) => seq("<", /[^>]+/, ">"),
    relative_path: ($) => seq('"', /[^"]+/, '"'),
    constant: ($) => /[a-zA-Z0-9_]+/,

    identifier: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    bind_operator: ($) => seq("-", ">"),

    full_type_identifier: ($) =>
      seq(
        field("module", repeat(seq(/[a-zA-Z_][a-zA-Z0-9_]*/, "::"))),
        field("type", $.identifier),
      ),

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
        $.enum,
        $.custom_enum,
        $.list,
        $.impl_ref,
      ),

    field: ($) =>
      seq(
        field("field_identifier", $.identifier),
        ":",
        field("field_value", $.field_value),
      ),
    fields: ($) => seq($.field, repeat(seq(",", $.field)), optional(",")),

    struct_impl_keyword: ($) => seq("$", "struct"),
    struct_impl: ($) =>
      seq(
        $.struct_impl_keyword,
        field("identifier", $.identifier),
        $.bind_operator,
        field("bind", $.full_type_identifier),
        "{",
        field("fields", $.fields),
        "}",
      ),

    expr_impl_keyword: ($) => seq("$", "expr"),
    expr_impl: ($) =>
      seq(
        $.expr_impl_keyword,
        field("identifier", $.identifier),
        $.bind_operator,
        field("bind", $.full_type_identifier),
        "{",
        optional(field("fields", $.fields)),
        "}",
      ),

    expr: ($) => seq("{", $.full_type_identifier, $.fields, "}"),
    struct: ($) => seq("{{", $.fields, "}}"),

    attribute_value: ($) =>
      choice(
        $.boolean,
        $.float,
        $.integer,
        $.string,
        $.enum,
        $.custom_enum,
        $.list,
        $.impl_ref,
        $.expr,
        $.struct,
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
