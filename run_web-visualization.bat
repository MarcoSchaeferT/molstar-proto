start cmd /k  http-server -p 5020
ping -n 5 localhost> nul
start chrome http://127.0.0.1:5020/build/examples/ply-wrapper/index.html
start cmd /k  npm run watch-extra