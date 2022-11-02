# file-go
本程序使用 windows 平台的一些工具进行文件的复制、备份、迁移。支持使用通配符排除不需要的文件。若要获得更多的文件访问权限，建议使用管理员身份运行。

``` sh
# 安装
npm i -g file-go

# 查看使用说明
file-go --help
```


**复制**
```
file-go copy file=C:/Users/win/Videos,C:/Users/win/Pictures out=D:/store
```

假设你想把一些文件复制到某个地方，由于需要经常访问，则不使用压缩，例如视频、照片，可以使用此方法。

**备份**
```
file-go zip file=C:/Users/win/Downloads,C:/Users/win/Documents out=D:/store
```

假设你想把一些文件压缩为一个 zip 包保存起来（要访问时需要解压缩），可以使用此方法。压缩后可以上传到云盘之类的地方。

**迁移**
```
file-go link file=C:/Users/win/Downloads,C:/Users/win/Documents out=D:/link
```

当你的某个分区空间不足，你想一些占用空间较大的目录移动到其他分区时，例如想应用程序数据同时又不影响程序使用时，可以使用此方法。

你可以使用 WizTree 找到分析空间占用情况。


