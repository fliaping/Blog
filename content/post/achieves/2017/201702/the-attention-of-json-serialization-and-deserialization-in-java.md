+++
author = "Payne Xu"
categories = ["Developer"]
date = 2017-02-27T08:47:25Z
description = ""
draft = false
slug = "the-attention-of-json-serialization-and-deserialization-in-java"
tags = ["java"]
title = "java常用JSON库注意事项总结"

+++


 
如果想将对象进行网络传输，就需要序列话和反序列化。主要分为以文本为介质和以二进制为介质。以文本为介质最广泛的是 xml 和 json ，但是 xml 过于冗长，json 成为最常用的序列化反序列化的中间保存介质。以二进制方式保存的方式优点是速度快，数据量小，缺点是 human-unfriendly，目前比较流行的是 google 的 protobuf，比 java 原始序列化更快。
 <!-- more -->

目前常用的json序列化反序列化类库有Jackson、Gson、Fastjson，其中Fastjson利用 ASM 框架，速度是这三者中最快的。速度的对比该项目做了详细的评测[eishay/jvm-serializers](https://github.com/eishay/jvm-serializers/wiki)，本文介绍下这三种 json 库在使用过程中需要注意的地方。

## fastjson

1. 字段命名问题
例如一个boolean成员变量isOnline，通过IDEA自动生成`getter:isOnline()，setter:setOnline(boolean online)`，我们期望序列化之后得到`{"isOnline":true}`，但是实际是`{"online":true}`，很容易解决，将getter写成isIsOnline()就可以了，同样的问题在Jackson中也存在，但在Gson中就没有。

2. null值的处理
默认情况下null变量不会写到json中（Gson也是如此）
如果想将null值写到json，需要启用`SerializerFeature.WriteMapNullValue`，此外还有其它对于null值的处理方式。

3. 反序列化时为对象时，必须要有默认无参的构造函数，否则会报异常`com.alibaba.fastjson.JSONException: default constructor not found.`
4. json数组反序列化实例

```
List<MessagesModel> models = JSON.parseArray("[{\"id\":\"12345\"},{\"id\":\"777\"}]",MessagesModel.class);
```

## jackson

1. 驼峰变量的转换
驼峰规范分为大驼峰（所有单词首字母大写）和小驼峰（除第一个单词其它单词首字母大写）我们在用jackson时，例如：`beFlag`和`BeFlag`都会序列化为`{"beFlag":null}`，但当变量名用一个大写字符作为大驼峰的第一个单词，例如`BFlag`，我们期望转成json是为`{"bFlag":null}`，实际情况是`{"bflag":null}`，全部转换为小写。同样的在反序列化中`bFlag`是不行的，应该和序列化出来的完全一致才行。

```
beFlag -> beFlag
BeFlag -> BeFlag
BFlag -> bflag

```

2. 非public属性变量的处理
非public属性的变量不会进行序列化和反序列化，除非有getter和setter方法（Gson可以），当然我们的POJO一般都是private，通过getter、setter操作（fastjson也是如此）

3. 静态变量不序列化

4. @JsonProperty声明在非public field会使之可以读到

5. 加了@JsonProperty注解，默认是不做任何修改的字段名，也可以手动设置解析的名字

6. 对象中的空属性会被序列化为null，例如：`{"beFlag":null}`，fastjson和Gson则不会。
7. json中如果设置某filed为字符串"null"，反序列化后对象属性为null
8. 字符类型的变量，json中传入ASCII，例如：`{"at":60}`或者`{"at":"60"}`，jackson可以正常反序列化为`'<'`，而Gson和Fastjson不可以，应该是jackson做了强制转换。
9. 布尔字段问题，布尔字段不要以is开头，原因是根据javaBean的规范，字段`boolean isTest`的getter、setter方法分别是isIsTest()和setIsTest()，但是通常IDE自动生成或者lombok的方法分别是isTest()和setTest()，因此在反序列化的时候，jackson根据json中的字段推断出setter方法，例如反序列化 `{"isTest":true}` 的时候，jackson会去找setIsTest()方法，但类中只有setTest方法，导致该字段没有设置。该问题fastjson也存在，gson中会兼容这种情况。
10. json数组反序列化示例
```
String json = "[{\"id\":\"12345\"},{\"id\":\"777\"}]";
//方法一
List<MessagesModel> model = mapper.readValue(json, TypeFactory.defaultInstance().constructCollectionType(List.class,MessagesModel.class));
//方法二
List<MessagesModel> model = mapper.readValue(json,new TypeReference<List<MessagesModel>>(){});
//方法三
List<MessagesModel> model = Arrays.asList(mapper.readValue(json,MessagesModel[].class));
```



## google-gson
1. 默认情况下null变量不会写到json中

2. 默认会开启 html 转义，可以通过`disableHtmlEscaping`禁用

```java
Gson gson = new GsonBuilder().disableHtmlEscaping().create();
String json = gson.toJson(entity);
```

3. gson反序列化/序列化json的时候内存管理不是太好，引发较多gc。
4. json中key的名字是java关键字，可以使用`@SerializedName`注释。
5. json数组反序列化示例

```java
//以下方法可用，类型通过Class变量，在反序列化中可使用
public static <T> List<T> fromJsonArray(String json, Class<T> clazz) throws Exception {
        List<T> lst = new ArrayList<T>();

        JsonArray array = new JsonParser().parse(json).getAsJsonArray();
        for(final JsonElement elem : array){
            lst.add(new Gson().fromJson(elem, clazz));
        }

        return lst;
    }
    
//以下方法不可用，原因是泛型在编译时被擦除
public static <T> List<T> getObjects(String jsonString,Class<T> cls) {
   List<T> list = new ArrayList<T>();
   if (jsonString == "[]") {
       return list;
   }
   Gson gson = new Gson();
   list = gson.fromJson(jsonString, new TypeToken<List<T>>(){}.getType());
   return list;
    }
```


## 其它 
另外还有json-lib，flexjson，json-io，genson等不常用的库，这里不加分析。但他们的性能都没有上面介绍的三个常用的好，所以在实际应用中尽量不用考虑。


# 参考资料
* [fastjson](https://github.com/alibaba/fastjson)
* [jackson](https://github.com/FasterXML/jackson)
* [gson](https://github.com/google/gson)
* [jvm-serializers](https://github.com/eishay/jvm-serializers)
* [json-lib(ezmorph)、gson、flexJson、fastjson、jackson对比，实现java转json，json转java](http://www.voidcn.com/blog/novelly/article/p-4713639.html)
* [几种常用JSON库性能比较](http://vickyqi.com/2015/10/19/%E5%87%A0%E7%A7%8D%E5%B8%B8%E7%94%A8JSON%E5%BA%93%E6%80%A7%E8%83%BD%E6%AF%94%E8%BE%83/)


