/**
 * @file TypeML grammar for tree-sitter
 * @author Irisu <mrapacheee@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "type_ml",

  extras: ($) => [/[\s\t\r\n]/, $.comment_multi, $.line_comment],

  conflicts: ($) => [
    // Возможные конфликты можно добавить позже
  ],

  rules: {
    // TODO: add the actual grammar rules
    source_file: ($) =>
      seq(repeat($.directive), repeat($.element), repeat($.impls)),

    // Комментарии
    comment_multi: ($) =>
      token(seq("/*", repeat(choice(/[^*]/, seq("*", /[^\/]/))), "*/")),

    line_comment: ($) => token(seq("//", repeat(/[^\n]/), /\n?/)),

    // Идентификаторы
    ident: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    ns_ident: ($) => seq($.ident, repeat(seq("::", $.ident))),

    alias: ($) => seq("@", $.ident),

    // Литералы
    integer: ($) => /-?[0-9]+/,
    float: ($) => /-?[0-9]+\.[0-9]*/,
    number: ($) => choice($.float, $.integer),

    boolean: ($) => choice("true", "false"),

    string: ($) => seq('"', repeat(choice(/[^"\\]/, /\\./)), '"'),

    enum_val: ($) => choice($.ident, $.custom),

    custom: ($) => /[^\s{}\[\],=>\/"][^\s{}\[\],=>\/"]*/,

    // Структуры
    structure: ($) => seq("{{", choice($.struct_fields, $.impl_ref), "}}"),

    struct_fields: ($) =>
      seq($.struct_field, repeat(seq(",", optional($.struct_field)))),

    struct_field: ($) =>
      seq(field("name", $.ident), ":", field("value", $.field_value)),

    field_value: ($) => choice($.boolean, $.enum_val, $.string),

    // Директивы
    directive_content: ($) => repeat1(/[^>]/),

    //directive: ($) =>
    //  seq(
    //    "#",
    //    field("name", $.ident),
    //    optional(seq("<", field("content", $.directive_content), ">")),
    //  ),
    directive: ($) =>
      prec.right(
        1,
        seq(
          "#",
          field("name", $.ident),
          optional(seq("<", field("content", $.directive_content), ">")),
        ),
      ),

    // Элементы
    element: ($) => choice($.empty_tag, $.tag),

    empty_tag: ($) =>
      seq(
        "<",
        field("name", $.ns_ident),
        optional(field("alias", $.alias)),
        repeat(field("attribute", $.attribute)),
        "/>",
      ),

    tag: ($) =>
      seq(
        "<",
        field("name", $.ns_ident),
        optional(field("alias", $.alias)),
        repeat(field("attribute", $.attribute)),
        ">",
        repeat(field("children", $.element)),
        "</",
        field("end_name", $.ns_ident),
        ">",
      ),

    // Атрибуты
    attr_value: ($) =>
      choice($.boolean, $.enum_val, $.string, $.expression, $.structure),

    attribute: ($) =>
      seq(field("name", $.ident), "=", field("value", $.attr_value)),

    // Выражения
    expression: ($) =>
      seq(
        "{",
        choice(
          seq(field("function", $.ns_ident), field("args", $.expr_args)),
          field("impl_ref", $.impl_ref),
        ),
        "}",
      ),

    expr_args: ($) => seq($.expr_arg, repeat(seq(",", optional($.expr_arg)))),

    expr_arg: ($) =>
      seq(field("name", $.ident), ":", field("value", $.arg_val)),

    arg_val: ($) => choice($.boolean, $.enum_val, $.string, $.list_val),

    list_val: ($) =>
      seq("[", optional(seq($.arg_val, repeat(seq(",", $.arg_val)))), "]"),

    // Имплементации
    impl_ref: ($) => seq("$", $.ident),

    impls: ($) => choice($.expr_impl, $.struct_impl),

    expr_impl: ($) =>
      seq(
        "$",
        "expr",
        field("name", $.ident),
        "->",
        field("target", $.ns_ident),
        "{",
        field("args", $.expr_args),
        "}",
      ),

    struct_impl: ($) =>
      seq(
        "$",
        "struct",
        field("name", $.ident),
        "->",
        field("target", $.ns_ident),
        "{",
        field("fields", $.struct_fields),
        "}",
      ),
  },
});
