# Blog

## init

1. clone 当前项目
2. 初始化作为子模块的themes

```bash
git submodule init
git submodule update --remote
```

## workflow

1. 新建草稿: `hugo new draft/new-article.md`
2. 撰写文章, 并push到github
3. 准备发布: 将meta信息中的draft改为false, 并移动到post目录
4. deploy到服务器: `./deploy`
