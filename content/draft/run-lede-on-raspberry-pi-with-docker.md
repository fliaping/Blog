+++
author = "Payne Xu"
date = 2017-09-18T04:55:43Z
description = ""
draft = true
slug = "run-lede-on-raspberry-pi-with-docker"
title = "在树莓派上用Docker运行LEDE(OpenWrt)"

+++

/usr/sbin/uhttpd -f -h /www -r OpenWrt -x /cgi-bin -u /ubus -t 60 -T 30 -k 20 -A 1 -n 3 -N 100 -R -p 0.0.0.0:80