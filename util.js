const os = require(`os`)
const arch = os.arch()
const path = require(`path`)
const shelljs = require(`shelljs`)
const cp = require(`child_process`)
const fs = require(`fs`)
const defaultArg = {
  ignore: [
    `node_modules*`,
    `httpData*`,
    `.history`,
    `*-cache`,
    `.cache`,
    `cache`,
  ],
  out: `${process.cwd()}/store`,
}

function treeSize(path = ``){
  run({note: `分析磁盘空间使用情况`, cmd: `"${__dirname}/lib/WizTree/WizTree${arch === `x64` ? `64` : ``}.exe" "${path}"`, code: [0]})
}

function handleInfo(path = ``){
  path = path.replace(/\//g, `\\`) // 注: UnlockHandle.ps1 支持的目录分割符是 \ 而不是 /
  run({note: `查看占用`, cmd: `PowerShell.exe -ExecutionPolicy unrestricted -File "${__dirname}/lib/Handle-Unlocker/UnlockHandle.ps1" -target "${path}"`, code: [0]})
}

/**
 * 移动目录到指定位置并创建链接
 * @param {*} param0 
 */
function linkDir({
  file = [], // 要创建链接的目录列表
  out = defaultArg.out, // 链接存储的目的位置
} = {}) {
  file.forEach(item => {
    let src = item.replace(/\\/g, `/`)
    const srcName = src.split(`/`).slice(-1)[0]
    fs.existsSync(`${src}_back`) && run({note: `确定移除旧文件`, cmd: `rd /s /q "${src}_back"`, code: [0]})
    run({note: `测试访问权限或占用状态`, cmd: `cd /d "${src}" && cd ../ && ren "${srcName}" "${srcName}_back" && ren "${srcName}_back" "${srcName}"`, code: [0], errCb: () => {
      handleInfo(src)
      console.log(`请使用管理员身份启动程序或解除相关占用后重试`)
    }})
    copy({file: [src], out, ignore: []})
    run({note: `移除旧文件`, cmd: `cd /d "${src}" && cd ../ && ren "${srcName}" "${srcName}_back"`, code: [0]})
    run({note: `创建链接`, cmd: `mklink /J "${src}" "${`${out}/${src.replace(`:`, ``)}`}"`, code: [0]})
    run({note: `确定移除旧文件`, cmd: `rd /s /q "${src}_back"`, code: [0]})
  })
}


/**
 * 复制文件
 * @param {*} param0 
 */
function copy({
  file = [], // 要复制的文件列表
  out = defaultArg.out, // 要复制到的目的地
  ignore = defaultArg.ignore, // 要排除的文件列表
} = {}) {
  file.forEach(item => {
    const arr = [
      `robocopy`,
      `"${item}"`,
      `"${out}/${item.replace(`:`, ``)}"`, // 保存源目录结构
      `/E`, // 复制所有子目录包括空文件夹
      // `/COPYALL`, // 复制所有文件信息(等同于 /COPY:DATSOU), 需要管理员模式才能使用此参数
      `/R:3`, // 指定复制失败时的重试次数
      `/W:10`, // 指定等待重试的间隔时间，以秒为单位
      `/MT:32`, // 使用 n 个线程创建多线程副本
      ignore.length ? `/XD ${ignore.join(` `)}` : undefined, // 排除与指定名称和路径匹配的目录
      ignore.length ? `/XF ${ignore.join(` `)}` : undefined, // 排除与指定名称和路径匹配的文件
    ]
    const cmd = arr.filter(Boolean).join(` `)
    run({note: `复制文件`, cmd, code: [0, 1]})
  })
}

/**
 * 压缩文件
 * @param {*} param0 
 */
function zip({
  out = defaultArg.out, // 输出文件名
  file = [], // 要压缩的文件列表
  v = `1g`, // 分卷大小, 传 false 为不使用分卷
  p = undefined, // 压缩密码
  spf = true, // 是否存储绝对地址, 如果要压缩的文件名有相同时, 需要指定, 否则会出错
  mx = 0, // 配置压缩等级, 0 为不压缩, 0-9
  ignore = defaultArg.ignore, // 要排除的文件列表
  w, // 临时文件目录
} = {}) {
  ;(fs.existsSync(`${out}.zip`) || fs.existsSync(`${out}.zip.001`)) && shelljs.rm(`${out}.zip*`) // 删除已存在的文件
  w = w || path.parse(out).dir
  const arr = [
    `"${__dirname}/lib/7z/7z.exe"`,
    `a`,
    `"${out}"`,
    ...file.map(item => `"${item}"`),
    v ? `-v${v}` : undefined,
    p ? `-p${p}` : undefined, // -mhe 可以加密文件名, 但 .zip 格式不支持
    spf ? `-spf` : undefined,
    `-tzip`,
    `-mx${mx}`,
    ...ignore.map(item => `-xr!"${item}"`),
    `-w"${w}"`,
  ]
  const cmd = arr.filter(Boolean).join(` `)
  run({note: `压缩文件`, cmd})
}

/**
 * 运行命令
 * @param {*} param0 
 * @param {string} param0.note 命令描述
 * @param {string} param0.cmd 要运行的命令本身
 * @param {array[number]} param0.code 命令成功的标志, 不传时默认成功, 传时必须包含指定命令退出码才表示成功
 */
function run({note, cmd, code = [0], errCb = () => {}, cwd}) {
  console.log(`${note}: ${cmd}`)
  try {
    typeof(cmd) === `function` ? cmd() : cp.execSync(cmd, {stdio: `inherit`, maxBuffer: 9e9, cwd})
  } catch (error) {
    if(code.includes(error.status) === false) {
      console.log(`${note} -- 任务运行失败, 状态码: ${error.status}`)
      errCb()
      process.exit()
    }
  }
}

/**
 * 解析命令行参数
 * @param {*} arr 
 * @returns 
 */
function parseArgv(arr) {
  return (arr || process.argv.slice(2)).reduce((acc, arg) => {
    let [k, ...v] = arg.split(`=`)
    v = v.join(`=`) // 把带有 = 的值合并为字符串
    acc[k] = v === `` // 没有值时, 则表示为 true
      ? true
      : (
        /^(true|false)$/.test(v) // 转换指明的 true/false
        ? v === `true`
        : (
          /[\d|.]+/.test(v)
          ? (isNaN(Number(v)) ? v : Number(v)) // 如果转换为数字失败, 则使用原始字符
          : v
        )
      )
    return acc
  }, {})
}


module.exports = {
  treeSize,
  handleInfo,
  parseArgv,
  copy,
  linkDir,
  zip,
}
