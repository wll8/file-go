const fs = require(`fs`)
const util = require(`./util.js`)

new Promise(async () => {
  const cliArg = util.parseArgv()
  const [arg1] = process.argv.slice(2)
  if([undefined, `--help`, `-h`].includes(arg1)) {
    console.log(fs.readFileSync(`${__dirname}/readme.md`, `utf8`))
    process.exit()
  }
  try {
    const file = (cliArg.file || ``).split(`,`).filter(item => fs.existsSync(item))
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
    arg1 === `size` && (file.length ? file : [process.cwd()]).forEach(item => util.treeSize(item))
    arg1 === `handle` && (file.length ? file : [process.cwd()]).forEach(item => util.handleInfo(item))
  } catch (error) {
    console.info(error)
  }
  process.exit()
})