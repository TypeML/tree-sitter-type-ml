import XCTest
import SwiftTreeSitter
import TreeSitterTypeMl

final class TreeSitterTypeMlTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_type_ml())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading TypeML grammar")
    }
}
