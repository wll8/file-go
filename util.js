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
  console.log(`请使用管理员身份启动程序或解除相关占用(点击 Unlock All)后重试`)
  run({note: `查看占用`, cmd: `PowerShell.exe -ExecutionPolicy unrestricted -File "${__dirname}/lib/Handle-Unlocker/UnlockHandle.ps1" -target "${path}"`, code: [0]})
}

/**
 * 移动目录到指定位置并创建链接
 * @param {*} param0 
 */
function linkDir({
  file = [], // 要创建链接的目录列表
  out = defaultArg.out, // 链接存储的目的位置
  ignoreErr = false, // 忽略复制过程中的错误
} = {}) {
  file.forEach(item => {
    const srcPath = item.replace(/\\/g, `/`)
    const srcDir = path.parse(srcPath).dir
    const srcName = path.parse(srcPath).name
    const backName = `${srcName}_=${new Buffer.from(os.userInfo().username).toString(`base64`)}=link=back=`
    const backPath = `${srcDir}/${backName}`
    fs.existsSync(backPath) && run({note: `尝试移除旧文件`, cmd: `rd /s /q "${backPath}"`, code: [0], errCb: (err, exit) => {handleInfo(backPath), exit()}})
    run({note: `测试访问权限-测试`, cmd: `cd /d "${srcDir}" && ren "${srcName}" "${backName}"`, code: [0], errCb: (err, exit) => {handleInfo(srcPath), exit()}})
    run({note: `测试访问权限-还原`, cmd: `cd /d "${srcDir}" && ren "${backName}" "${srcName}"`, code: [0], errCb: (err, exit) => {handleInfo(backPath), exit()}})
    copy({file: [srcPath], out, ignore: [], ignoreErr})
    run({note: `测试访问权限-测试`, cmd: `cd /d "${srcDir}" && ren "${srcName}" "${backName}"`, code: [0], errCb: (err, exit) => {handleInfo(srcPath), exit()}})
    run({note: `创建文件链接`, cmd: `mklink /J "${srcPath}" "${`${out}/${srcPath.replace(`:`, ``)}`}"`, code: [0]})
    fs.existsSync(backPath) && run({note: `尝试移除旧文件`, cmd: `rd /s /q "${backPath}"`, code: [0], errCb: (err, exit) => {handleInfo(backPath), exit()}})
  })
}

/**
 * 粉碎标记为已删除的文件
 * 此操作不会对已存在的文件进行操作, 它对硬盘上已被删除的文件进行内容重写以避免恢复
 * @param {*} param0 
 */
function crush({
  file = [],
} = {}) {
  file.forEach(item => {
    const srcPath = item.replace(/\\/g, `/`)
    run({note: `正在粉碎标记为已删除的文件`, cmd: `cipher /w:"${srcPath}"`, code: [0], errCb: (err, exit) => {handleInfo(srcPath), exit()}})
  })
}

/**
 * 安全删除文件
 * sdelete https://learn.microsoft.com/en-us/sysinternals/downloads/sdelete
  - 避免出现许可证弹窗 https://hahndorf.eu/blog/post/2010/03/07/WorkAroundSysinternalsLicensePopups
  - `reg.exe ADD "HKCU\Software\Sysinternals\SDelete" /v EulaAccepted /t REG_DWORD /d 1 /f`
 * 经测试使用 sdelete 删除或使用 crush 覆盖能被电脑管家文件恢复工具万能模式恢复, 
 * 但 Recuva/DiskGenius/WinfrGUI/disk-drill 都不能恢复, 
 * 暂不知道是不是电脑管家对系统做了什么操作(例如电脑管家本身就有一个删除备份的功能).
 * 另外, 使用 sdelete 传入中文时报错 `No files/folders found that match E:/???.`
 * 所以这里使用普通删除再使用 crush
 * 
 * 
 * @param {*} param0 
 */
function sdelete({
  file = [],
} = {}) {
  file.forEach(item => {
    const srcPath = item.replace(/\\/g, `/`)
    fs.existsSync(srcPath) && run({note: `正在删除文件`, cmd: `rd /s /q "${srcPath}"`, code: [0], errCb: (err, exit) => {handleInfo(srcPath), exit()}})
    crush({file: [srcPath]})
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
  ignoreErr = false, // 忽略复制过程中的错误
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
      `/MT:64`, // 使用 n 个线程创建多线程副本
      `/NDL`, // 不输出目录名
      `/NC`, // 不输出文件类
      `/COPY:DAT`, // 复制数据、属性、时间戳
      `/DCOPY:DAT`, // 复制数据、属性、时间戳
      ignore.length ? `/XD ${ignore.join(` `)}` : undefined, // 排除与指定名称和路径匹配的目录
      ignore.length ? `/XF ${ignore.join(` `)}` : undefined, // 排除与指定名称和路径匹配的文件
    ]
    const cmd = arr.filter(Boolean).join(` `)
    run({note: `复制文件`, cmd, code: [0, 1], errCb: (err, exit) => {
      if(ignoreErr === false) {
        console.log(`出现处理失败的文件, 若错误程度可以接受, 可以使用 ignoreErr=true 选项忽略本错误`)
        exit()
      } else {
        console.log(`由于你使用了 ignoreErr=true 选项, 本错误将被忽略`)
      }
    }})
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
function run({note, cmd, code = [0], errCb = (err, exit) => {exit()}, cwd}) {
  console.log(`${note}: ${cmd}`)
  try {
    typeof(cmd) === `function` ? cmd() : cp.execSync(cmd, {stdio: `inherit`, maxBuffer: 9e9, cwd})
  } catch (error) {
    if(code.includes(error.status) === false) {
      console.log(`${note} -- 任务运行失败, 状态码: ${error.status}`)
      errCb(error, process.exit)
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
  crush,
  sdelete,
  treeSize,
  handleInfo,
  parseArgv,
  copy,
  linkDir,
  zip,
}
