# TransHistory
一个记录跨性别历史的网站，包括事件史、人物史、理论文化史。

## 运行方法
1. 从源码运行
    - git clone and checkout
    - ```sh
      python3 -m venv .run/venv
      source .run/venv/bin/activate
      python3 -m pip install --requirement=requirements.txt
      python3 manage.py runserver
      ```
    - 打开 http://127.0.0.1:8000/
2. 用docker运行
    - ```sh
      docker run -ditp 8000:8000 --rm --name transhistoria ghcr.io/transhistoria/transhistoria:latest
      ```
    - 打开 http://127.0.0.1:8000/
3. 部署到cloudflare workers
    - git clone and checkout
    - install nodejs && corepack
    - ```sh
      corepack yarn install
      corepack yarn run deploy
      ```
    - 打开 https://webapp_container.YOUR_CF_NAME.workers.dev/ 或者 https://transhistoria.org/