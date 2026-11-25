# TASKFUSION
Operation	Command
Generate SSH key	ssh-keygen -t ed25519 -C "email"
Display public key	type keyfolder.pub
Add SSH key	ssh-add keyfolder
Check SSH key	ssh-add -l
Test connection	ssh -T git@github.com
Clone	git clone SSH_URL
Initialize	git init
Add origin	git remote add origin SSH_URL
Check origin	git remote -v
Add files	git add .
Commit	git commit -m "message"
Push	git push -u origin main
Pull	git pull origin main
/////////////////////////////////////

services:
  db:
    image: mysql:8.0
    container_name: mysql_db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wpuser
      MYSQL_PASSWORD: wp123
    volumes:
      - db_data:/var/lib/mysql

  web:
    image: wordpress:latest
    container_name: wordpress_web
    restart: always
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: db:3306
      WORDPRESS_DB_USER: wpuser
      WORDPRESS_DB_PASSWORD: wp123
      WORDPRESS_DB_NAME: wordpress
    depends_on:
      - db

volumes:
  db_data:
