module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Type enum
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation changes
        "style", // Code style changes (formatting, missing semi-colons, etc)
        "refactor", // Code refactoring
        "perf", // Performance improvements
        "test", // Adding or updating tests
        "build", // Build system or external dependencies
        "ci", // CI configuration changes
        "chore", // Other changes that don't modify src or test files
        "revert", // Revert a previous commit
      ],
    ],
    // Subject case should be sentence-case, start-case, pascal-case or upper-case
    "subject-case": [0],
    // Body should have blank line before it
    "body-leading-blank": [2, "always"],
    // Footer should have blank line before it
    "footer-leading-blank": [2, "always"],
    // Max length for header
    "header-max-length": [2, "always", 100],
    // Subject should not be empty
    "subject-empty": [2, "never"],
    // Type should not be empty
    "type-empty": [2, "never"],
  },
};
