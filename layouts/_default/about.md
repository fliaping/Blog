# {{ .Title }}

{{ .Params.about.greeting }} · {{ .Params.about.alias }}

> {{ delimit .Params.about.headline "" }}

{{ .Params.about.intro }}

{{ .RawContent }}
## 我怎样做事
{{ range .Params.about.strengths }}
### {{ .title }}

{{ .text }}
{{ end }}
## 最近在构建
{{ range .Params.about.work }}
### {{ .name }} · {{ .category }}

{{ .title }}

{{ .text }}

[{{ .linkLabel }}]({{ .link }})
{{ end }}
## 一路走来
{{ range .Params.about.journey }}
### {{ .period }} · {{ .title }}

{{ .text }}
{{ end }}
## 工作之外
{{ range .Params.about.life }}
### {{ .title }}

{{ .text }}
{{ end }}
书架的一角：{{ range .Params.about.books }}《{{ . }}》 {{ end }}

## 从文章认识我
{{ range .Params.about.writing }}
- {{ .year }} · [{{ .title }}]({{ .link }})：{{ .note }}
{{ end }}
## {{ .Params.about.contactTitle }}

{{ .Params.about.contactText }}
{{ range .Params.about.contacts }}
- [{{ .label }}]({{ .url }})
{{ end }}
