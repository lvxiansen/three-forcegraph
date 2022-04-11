module.exports = {
    "env": {
        "browser": true,
        "node":true,
        "commonjs":true,
        "es6":true
    },
    "extends": [
        // "eslint:recommended",
        "plugin:vue/essential"
    ],
    "parserOptions": {
        "ecmaVersion": 10,
        "sourceType": "module"
    },
    "plugins": [
        "vue"
    ],
    "rules": {
        "no-func-assign":0,
        "no-unused-vars":0,
        "no-prototype-builtins":0
    }
}
