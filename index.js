#!/usr/bin/env node

const util = require(`./util.js`)

if (require.main === module) { // 通过 cli 使用
  require(`./cli.js`)
} 

module.exports = {
  copy: util.copy,
  linkDir: util.linkDir,
  zip: util.zip,
}
