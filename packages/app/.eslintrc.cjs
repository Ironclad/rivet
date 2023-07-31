module.exports = {
    "extends": "../../.eslintrc.cjs",
    "root": true,
    "plugins": [
        "react-hooks"
      ],
    "overrides": [{
        "files": ["*.ts", "*.tsx"],
        "parserOptions": {
            "project": true,
            "ecmaVersion": "latest",
        }
    }]
}
