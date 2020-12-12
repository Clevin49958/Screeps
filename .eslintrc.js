module.exports = {
  'env': {
    'commonjs': true,
    'es2021': true,
    'node': true,
  },
  'extends': [
    'google',
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 12,
  },
  'plugins': [
    '@typescript-eslint',
  ],
  'rules': {
    'max-len': ["error", { 
      "code": 100, 
      "ignoreTemplateLiterals": true,
      "ignoreComments": true,
      "ignoreStrings": true
    }],
    'guard-for-in': 'off',
    'valid-jsdoc': [
      "error", {
        "prefer": {
          "return": "returns"
        },
        'requireReturn': false,
        'requireParamDescription': false
      }
    ]
  },
};
