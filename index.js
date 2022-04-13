const shelljs = require(`shelljs`)

let [src = ``, dist = `D:/link`] = process.argv.slice(2) || []
console.log({src, dist})

src = src.replace(/\\/g, `/`)
dist = dist.replace(/\\/g, `/`)

if(Boolean(src && dist) === false) {
  console.log(`目录迁移工具`)
  console.log(`$0 src dist`)
  console.log(`src  要迁移的目录`)
  console.log(`dist 迁移到什么目录`)
  process.exit()
}

// 目录名
const srcName = src.split(`/`).slice(-1)[0]

// PowerShell.exe -ExecutionPolicy unrestricted -File UnlockHandle.ps1 -target xxx
run({note: `测试访问权限或占用状态`, cmd: `cd /d "${src}" && cd ../ && ren "${srcName}" "${srcName}_back" && ren "${srcName}_back" "${srcName}`, code: [0]})
run({note: `复制文件`, cmd: `robocopy "${src}" "${dist}/${srcName}" /E /R:3 /W:10 /MT:32`, code: [0, 1]})
run({note: `移除旧文件`, cmd: `cd /d "${src}" && cd ../ && ren "${srcName}" "${srcName}_back"`, code: [0]})
run({note: `创建链接`, cmd: `mklink /J "${src}" "${dist}/${srcName}"`, code: [0]})
run({note: `确定移除旧文件`, cmd: `rd /s /q "${src}_back"`, code: [0]})

function run({note, cmd, code}) {
  console.log(`${note}: ${cmd}`)
  const stepRes = typeof(cmd) === `function` ? cmd() : shelljs.exec(`chcp 65001>nul && ${cmd}`)
  if(code && code.includes(stepRes.code) === false) {
    console.log(`${note}错误 ${stepRes.code}`)
    process.exit()
  }
}
