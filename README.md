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
4. push 到 `master` 后由 GitHub Actions 自动构建并发布到 GitHub Pages

## GitHub Pages

首次启用时，在 GitHub 仓库 `Settings -> Pages` 中将 `Build and deployment` 的 `Source` 设置为 `GitHub Actions`。

未配置自定义域名时，站点会发布到 GitHub Pages 默认地址。

## other

分类：

- Developer
- AI之遥
- 科幻Fans
- 智慧之光
- 星云尘埃
- 酷cool玩


图片处理：https://help.aliyun.com/zh/oss/user-guide/resize-images-4
