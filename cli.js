const fs = require(`fs`)
const util = require(`./util.js`)
const pkg = require(`./package.json`)

new Promise(async () => {
  const cliArg = util.parseArgv()
  const [arg1] = process.argv.slice(2)
  if([undefined, `--help`, `-h`].includes(arg1)) {
    console.info([
      `${pkg.name} v${pkg.version} ${pkg.homepage}`,
      ``,
      `${pkg.description}`,
      ``,
      `usage:`,
      `  link -- 保持原来的文件引用关系的情况下移动目录`,
      `    file -- 要处理的目录, 多个使用逗号分割`,
      `    out -- 要输出的目的地址, 默认: ./store`,
      ``,
      `  copy -- 复制目录到指定位置`,
      `    file -- 同上`,
      `    out -- 同上`,
      `    ignore -- 要忽略的文件或目录, 支持通配符, 多个使用逗号分割`,
      `           -- 默认: node_modules*,httpData*,.history,*-cache,.cache,cache`,
      `    noIgnore -- 不忽略任何文件`,
      ``,
      `  zip -- 压缩目录到指定位置`,
      `    file -- 同上`,
      `    out -- 同上`,
      `    ignore -- 同上`,
      `    noIgnore -- 同上`,
      `    v -- 分卷大小, 传 false 为不使用分卷, 默认: 1g`,
      `    mx -- 配置压缩等级, 0 为不压缩, 0-9, 默认: 0`,
      ``,
      `eg:`,
      `  # 保持原来的文件引用关系的情况下, 转移一些目录到 D:/store 中`,
      `  ${pkg.name} link file=C:/temp,D:/temp out=D:/store`,
      ``,
      `  # 复制一些目录到 D:/store 目录下`,
      `  ${pkg.name} copy file=C:/temp,D:/temp out=D:/store`,
      ``,
      `  # 把一些目录压缩到一个 D:/store.zip 文件中`,
      `  ${pkg.name} zip file=C:/temp,D:/temp out=D:/store`,
      ``,
    ].join(`\n`))
    process.exit()
  }
  try {
    if(cliArg.file === undefined) {
      console.info(`请输入 file 参数`)
      process.exit()
    }
    const file = cliArg.file.split(`,`)
    const ignore = cliArg.noIgnore ? [] : cliArg.ignore ? cliArg.ignore.split(`,`).filter(item => item.trim()) : undefined
    arg1 === `link` && await util.linkDir({
      ...cliArg,
      file,
      ignore,
    })
    arg1 === `copy` && await util.copy({
      ...cliArg,
      file,
      ignore,
    })
    arg1 === `zip` && await util.zip({
      ...cliArg,
      file,
      ignore,
    })
  } catch (error) {
    console.info(error)
  }
  process.exit()
})