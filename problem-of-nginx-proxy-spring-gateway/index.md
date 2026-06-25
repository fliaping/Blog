
![spring cloud gateway](https://fliaping-blog.oss-rg-china-mainland.aliyuncs.com/storage/18-8-14/26795044.jpg)

## 背景

在不久前的一个项目中使用了[spring cloud gateway](https://cloud.spring.io/spring-cloud-gateway/), 开发测试中没出现什么问题,当上线之后就一直在报错,错误内容如下:

<!--more-->

```
2018-08-13 11:56:49,853 ERROR [] [reactor-http-server-epoll-7] org.springframework.web.server.adapter.HttpWebHandlerAdapter:handleFailure:213 Unhandled failure: Connection has been closed, response already set (status=304)
2018-08-13 11:56:49,855 WARN [] [reactor-http-server-epoll-7] org.springframework.http.server.reactive.ReactorHttpHandlerAdapter:lambda$apply$0:76 Handling completed with error: Connection has been closed
```

## 问题排查&解决

先是去看spring gateway的源码,其实gateway的源码内容不多,也比较清晰, 但是出错的地方并不是gateway, 而是gateway使用spring5的Reactive web的类库,随后接着看了Reactive web大概流程, 没发现什么问题. 最开始尝试从错误的后半段`response already set (status=304)`发现问题, 无果, 接着怀疑`Connection has been closed`, 心想Connection的问题时想起线上通过nginx代理的, 也就是说nginx和后端的服务连接被关闭了. 通过测试直连后端服务,并不能重现该错误,因此推断是nginx的问题.

于是乎本地安装了nginx,问运维要了线上的配置,并在本地配置代理,果然重现错误. nginx配置如下:

```
upstream open-gateway-keeper {
    server 127.0.0.1:13905;
    keepalive 100;
}

server { # simple load balancing
    listen          80;
    server_name     open.gateway.keeper;

    location / {
    proxy_set_header X-Real-IP $remote_addr;
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_set_header Host $http_host;
	proxy_set_header X-Forwarded-Proto https;

	proxy_pass http://open-gateway-keeper/;
    }
}
```

接着打开wireshark抓包,发现每次请求nginx和后端服务是短连接,也就是`打开TCP->传输数据->关闭TCP`这个过程,结合错误信息`Connection has been closed`,猜测可能就是这个原因. 通过google发现nginx代理的默认配置如下:

> By default, NGINX redefines two header fields in proxied requests, “Host” and “Connection”, and eliminates the header fields whose values are empty strings. “Host” is set to the $proxy_host variable, and “Connection” is set to close.
>
> 默认的,nginx重新定义了被代理请求头部的两个字段,分别是"Host"和"Connection",并且会去掉值为空字符的头部字段."Host"设置为变量$proxy_host, "Connection"设置为close
>
> (https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/#passing-request-headers)

默认情况下nginx在连接后端服务时将`Connection`设置为`close`, 这样就是http的短连接. 再次google, nginx代理后端长连接的配置方式是在location配置项中添加如下两个配置([参考stackoverflow](https://stackoverflow.com/questions/10395807/nginx-close-upstream-connection-after-request)):

```
proxy_http_version 1.1;
proxy_set_header Connection "";
```

配置之后即解决问题 🍓 🤩

## 后话

问题虽然解决了,但还有些疑问

1. 为何spring gateway不支持短连接
2. 另外一个问题,当后端返回304时gateway多加了header导致浏览器本地缓存时效,见issue[unnecessary response headers be added when backend return 304 status](https://github.com/spring-cloud/spring-cloud-gateway/issues/490).

这些问题还有待解决.需要对spring reactive框架进一步熟悉.