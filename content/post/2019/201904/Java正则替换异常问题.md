---
title: "Java正则替换异常问题"
date: 2019-04-19T16:43:01+08:00
draft: false
categories: ["unnamed"] # Developer AI之遥 科幻Fans 智慧之光 星云尘埃 酷cool玩
slug: "java-regex-replacement-exception-problem"
tags: ["Developer"]
author: "Payne Xu"

---

用Java进行正则匹配替换时，会出现莫名的异常，例如：

Exception in thread "main" java.lang.IllegalArgumentException: Illegal group reference

Exception in thread "main" java.lang.IndexOutOfBoundsException: No group 3

使用java正则替换，一般的方式是：

构建正则表达式：Pattern p = Pattern.compile(regex);
Matcher matcher = p.match(text);
通过matcher做查找替换操作
代码示例：

```java
Pattern p = Pattern.compile("cat");
Matcher m = p.matcher("one cat two cats in the yard");
StringBuffer sb = new StringBuffer();
while (m.find()) {
  m.appendReplacement(sb, "dog");
}
m.appendTail(sb);
System.out.println(sb.toString());
```

不过需要注意的是matcher中的替换操作有：

- replaceAll
- replaceFirst
- appendReplacement

前两个方法都会调用到appendReplacement，而该方法有一个特殊处理，当替换字符串中有`$`符号时会匹配group reference，具体就是遇到`$`，要么是`${groupName}`，要么是`$g` ，g为数字。如果不符合合适或者group不存在都会抛出异常。

示例：原字符串为 `aa, hello1world2, ee` ，匹配的正则为`(hello[0-9])(world[0-9])`，那么`replaceAll("$1, $2")` 得到的结果是：`aa, hello1, world2, ee`

其实就是这样的替换字符串就是先跟待替换字符串进行组合后再进行替换。


那么当我们的替换字符串中确实有`$`符号需要进行字面替换时，需要进行转义，例如  替换字符串为：`aa$bb`，会出现异常 java.lang.IllegalArgumentException: Illegal group reference，我们进行转义为：`aa\\$bb` 就可以正常替换

另外java.util.regex.Matcher#quoteReplacement方法为我们提供了转义的功能，可以直接使用，例如 `replaceAll(quoteReplacement("aa$bb"))`即可

应用：占位符置换器

```java
// 占位符置换器
public class PlaceHolderDisplacer {
    public Pattern lookForVar;

    public PlaceHolderDisplacer(String placeholderPattern) {
        this.lookForVar = Pattern.compile(placeholderPattern);
    }

    /**
     * 占位符替换，按照前后顺序进行参数替换
     * @param text 含有占位符的字符串
     * @param replaceIfNull 如果替换参数为空的默认替换内容
     * @param args 替换参数
     * @return 占位符被替换后的字符串
     */
    public String replace(String text, String replaceIfNull, String... args) {
        if (args == null) {
            args = new String[0];
        }
        StringBuffer stringBuffer = new StringBuffer();
        Matcher matcher = lookForVar.matcher(text);
        short varCount = 0;
        while (matcher.find()) {
            String replacement = replaceIfNull;
            if (varCount < args.length && args[varCount] != null) {
                replacement = args[varCount++];
            }
            matcher.appendReplacement(stringBuffer, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(stringBuffer);
        return stringBuffer.toString();
    }
}
```