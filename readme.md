# file-go
本程序使用 windows 平台的一些工具进行文件的复制、备份、迁移。支持使用通配符排除不需要的文件。若要获得更多的文件访问权限，建议使用管理员身份运行。

``` sh
# 安装
npm i -g file-go

# 查看使用说明
file-go --help
```

## 命令和参数
- size -- 分析磁盘空间使用情况
  - file -- 要处理的目录, 多个使用逗号分割, 默认为当前目录

- handle -- 查看目录占用情况
  - file -- 同上, 默认为当前目录

- link -- 保持原来的文件引用关系的情况下移动目录
  - file -- 同上, 无默认值, 必须指定此参数
  - out -- 要输出的目的地址, 默认: ./store

- copy -- 复制目录到指定位置
  - file -- 同上, 无默认值, 必须指定此参数
  - out -- 同上
  - ignore -- 要忽略的文件或目录, 支持通配符, 多个使用逗号分割, 默认: node_modules*,httpData*,.history,*-cache,.cache,cache
  - noIgnore -- 不忽略任何文件

- zip -- 压缩目录到指定位置
  - file -- 同上, 默认为当前目录
  - out -- 同上
  - ignore -- 同上
  - noIgnore -- 同上
  - v -- 分卷大小, 传 false 为不使用分卷, 默认: 1g
  - p -- 使用密码, 默认为空
  - mx -- 配置压缩等级, 0 为不压缩, 0-9, 默认: 0


## 示例

``` bat
:: 备份为 zip 包
:: 假设你想把一些文件压缩为一个 zip 包保存起来（要访问时需要解压缩），可以使用此方法。压缩后可以上传到云盘之类的地方。
:: 把一些目录压缩到一个 D:/store.zip 文件中, 密码为 123
file-go zip file=C:/temp,D:/temp out=D:/store p=123

:: 迁移
:: 分析目录体积, 找到要迁移的目录
file-go size
:: 当你的某个分区空间不足，你想一些占用空间较大的目录移动到其他分区时，例如想应用程序数据同时又不影响程序使用时，可以使用此方法。
:: 保持原来的文件引用关系的情况下, 转移一些目录到 D:/store 中
file-go link file=C:/temp,D:/temp out=D:/store

:: 复制
:: 假设你想把一些文件复制到某个地方，由于需要经常访问，则不使用压缩，例如视频、照片，可以使用此方法。
:: 复制一些目录到 D:/store 目录下
file-go copy file=C:/temp,D:/temp out=D:/store

```
